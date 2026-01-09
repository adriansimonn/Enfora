import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

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
  max: 100, // 10 attempts per IP per 15 minutes
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

// VERIFICATION CODE: Per-email limiting to prevent brute force attacks on 6-digit codes
export const verificationCodeLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per email per 15 minutes
  message: "Too many verification attempts. Please try again in 15 minutes.",
  keyGenerator: (req) => {
    // Use email from body for rate limiting (per-email instead of per-IP)
    const email = req.body.email || req.body.username;
    if (email) {
      return `verify:${email}`;
    }
    // Fall back to IP with proper IPv6 handling
    return `verify:${ipKeyGenerator(req)}`;
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

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