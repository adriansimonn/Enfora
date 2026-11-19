import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import { normalizeEmail } from "../src/utils/email.js";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect();

// Every limiter counts in Redis under its own name: rl:<name>:<key>. Left on the store's
// default prefix, limiters that produce the same key (the IP address, for the ones with no
// key generator) all add to one counter, and each then enforces its limit on the total.
const limiterNames = new Set();

const baseLimiter = (name, options) => {
  if (!name || limiterNames.has(name)) {
    throw new Error(`A rate limiter needs a name no other limiter uses (got "${name}")`);
  }
  limiterNames.add(name);

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: `rl:${name}:`,
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, optionsUsed) => {
      const retryAfter = res.getHeader('Retry-After');
      const minutesLeft = retryAfter ? Math.ceil(retryAfter / 60) : null;

      const message = minutesLeft
        ? `Too many attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
        : options.message || "Too many requests, please try again later.";

      res.status(429).json({ error: message });
    },
    ...options,
  });
};

/**
 * Key for the caller's IP address. Key generators call this instead of ipKeyGenerator
 * directly: it takes the request, so no call site can hand over the wrong thing. Anything
 * but the address string becomes the same text for every client, i.e. one shared bucket.
 */
function ipKey(req) {
  if (typeof req.ip !== "string" || !req.ip) {
    throw new Error("Rate limiter could not read the client IP address");
  }
  return `ip:${ipKeyGenerator(req.ip)}`;
}

/**
 * Key generator for limiters that sit behind requireAuth. A request with no signed-in user
 * means the limiter was mounted before requireAuth. That fails loudly rather than falling
 * back to a key that requests with no sign-in could fill up for everyone.
 */
const signedInUserKey = (limiterName) => (req) => {
  if (!req.user?.userId) {
    throw new Error(`${limiterName} must run after requireAuth`);
  }
  return req.user.userId;
};

// LOGIN: IP-BASED LIMITING (simpler, no custom key generator)
export const loginLimiter = baseLimiter("login", {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per 15 minutes
  message: "Too many login attempts. Try again later.",
});

// Shared by sign-up and resending the sign-up code
export const registerLimiter = baseLimiter("register", {
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many accounts created from this IP.",
});

export const refreshLimiter = baseLimiter("refresh", {
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 1000, // Higher limit in dev
  message: "Too many refresh attempts.",
});

// VERIFICATION CODE: 5 failed attempts per 15 minutes at a code (or at the password on the
// signed-in routes that use this), to prevent brute force.
// The bucket is whoever the attempt is against, never text the caller can vary:
// the signed-in user where there is one (so mount this after requireAuth), otherwise the
// email in the form the database looks it up by.
export const verificationCodeLimiter = baseLimiter("verify", {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per user or email per 15 minutes
  message: "Too many verification attempts. Please try again in 15 minutes.",
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    const email = req.body?.email;
    if (typeof email === "string" && email) {
      return `email:${normalizeEmail(email)}`;
    }
    return ipKey(req);
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// 2FA AT LOGIN: 5 wrong codes per account per 15 minutes, counted across every IP address
// and every spelling of the email.
// The account is only known once the password has been checked, so this is not mounted on
// the route: the login handler sets req.passwordVerifiedUserId and runs it with
// passesLimiter. Only someone who has the password can use up an account's attempts.
export const twoFactorLoginLimiter = baseLimiter("2fa-login", {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 wrong codes per account per 15 minutes
  message: "Too many incorrect codes. Please try again in 15 minutes.",
  keyGenerator: (req) => {
    if (!req.passwordVerifiedUserId) {
      throw new Error("twoFactorLoginLimiter needs req.passwordVerifiedUserId");
    }
    return req.passwordVerifiedUserId;
  },
  skipSuccessfulRequests: true, // Only count wrong codes
});

/**
 * Runs a limiter from inside a handler, for a limit that depends on something the handler
 * has to work out first. Resolves true if the request may go on, false if the limiter has
 * already answered it with a 429. Rejects if the limiter could not count the request.
 */
export async function passesLimiter(limiter, req, res) {
  let passed = false;
  let failure = null;
  await limiter(req, res, (error) => {
    if (error) {
      failure = error;
    } else {
      passed = true;
    }
  });
  if (failure) {
    throw failure;
  }
  return passed;
}

// PAYMENT ENDPOINTS: Strict rate limiting to prevent abuse and fraudulent charges
// Per user: run after requireAuth.
export const paymentLimiter = baseLimiter("payment", {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment operations per hour per user
  message: "Too many payment requests. Please try again later.",
  keyGenerator: signedInUserKey("paymentLimiter"),
});

// EVIDENCE UPLOAD: Per-user limiting. Each upload is buffered in memory, written to S3,
// parsed and sent to OpenAI, so one request is expensive.
// Per user: run after requireAuth.
export const evidenceUploadLimiter = baseLimiter("evidence", {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour per user
  message: "Too many evidence uploads. Please try again later.",
  keyGenerator: signedInUserKey("evidenceUploadLimiter"),
});

// PAYMENT CHARGE (Internal API): Stricter rate limiting
export const paymentChargeLimiter = baseLimiter("charge", {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 charge operations per hour (for scheduled task processing)
  message: "Too many charge requests.",
  keyGenerator: (req) => {
    // Calls that carry the real API key share one bucket; anything else is counted against
    // the caller's IP. The submitted key is never used as the bucket itself: a caller could
    // then pick a new bucket with every request, and the real key would be stored in Redis
    // as a key name.
    const expectedApiKey = process.env.PAYMENT_API_KEY;
    if (expectedApiKey && req.headers['x-api-key'] === expectedApiKey) {
      return "internal";
    }
    return ipKey(req);
  },
});
