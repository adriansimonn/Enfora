import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import { normalizeEmail } from "../src/utils/email.js";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect();

const baseLimiter = (options) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
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

// LOGIN: IP-BASED LIMITING (simpler, no custom key generator)
export const loginLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per 15 minutes
  message: "Too many login attempts. Try again later.",
});

// Other limiters unchanged
export const registerLimiter = baseLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many accounts created from this IP.",
});

export const refreshLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 1000, // Higher limit in dev
  message: "Too many refresh attempts.",
});

// VERIFICATION CODE: 5 failed attempts per 15 minutes at a code (or at the password on the
// signed-in routes that use this), to prevent brute force.
// The bucket is whoever the attempt is against, never text the caller can vary:
// the signed-in user where there is one (so mount this after requireAuth), otherwise the
// email in the form the database looks it up by.
export const verificationCodeLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per user or email per 15 minutes
  message: "Too many verification attempts. Please try again in 15 minutes.",
  keyGenerator: (req) => {
    if (req.user?.userId) {
      return `verify:user:${req.user.userId}`;
    }
    const email = req.body?.email;
    if (typeof email === "string" && email) {
      return `verify:email:${normalizeEmail(email)}`;
    }
    // Fall back to IP with proper IPv6 handling
    return `verify:ip:${ipKeyGenerator(req.ip)}`;
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// 2FA AT LOGIN: 5 wrong codes per account per 15 minutes, counted across every IP address
// and every spelling of the email.
// The account is only known once the password has been checked, so this is not mounted on
// the route: the login handler sets req.passwordVerifiedUserId and runs it with
// passesLimiter. Only someone who has the password can use up an account's attempts.
export const twoFactorLoginLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 wrong codes per account per 15 minutes
  message: "Too many incorrect codes. Please try again in 15 minutes.",
  keyGenerator: (req) => {
    if (!req.passwordVerifiedUserId) {
      throw new Error("twoFactorLoginLimiter needs req.passwordVerifiedUserId");
    }
    return `2fa-login:${req.passwordVerifiedUserId}`;
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
export const paymentLimiter = baseLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment operations per hour per user
  message: "Too many payment requests. Please try again later.",
  keyGenerator: (req) => {
    // Use userId if authenticated, otherwise IP with proper IPv6 handling
    const userId = req.user?.userId;
    if (userId) {
      return `payment:${userId}`;
    }
    return `payment:${ipKeyGenerator(req)}`;
  },
});

// EVIDENCE UPLOAD: Per-user limiting. Each upload is buffered in memory, written to S3,
// parsed and sent to OpenAI, so one request is expensive.
// Mount after requireAuth so the limit is keyed on the authenticated user.
export const evidenceUploadLimiter = baseLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour per user
  message: "Too many evidence uploads. Please try again later.",
  keyGenerator: (req) => {
    const userId = req.user?.userId;
    if (userId) {
      return `evidence:${userId}`;
    }
    return `evidence:${ipKeyGenerator(req.ip)}`;
  },
});

// PAYMENT CHARGE (Internal API): Stricter rate limiting
export const paymentChargeLimiter = baseLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 charge operations per hour (for scheduled task processing)
  message: "Too many charge requests.",
  keyGenerator: (req) => {
    // Use API key or IP with proper IPv6 handling for rate limiting
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return `charge:${apiKey}`;
    }
    return `charge:${ipKeyGenerator(req)}`;
  },
});