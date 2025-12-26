import rateLimit from "express-rate-limit";
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
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many accounts created from this IP.",
});

export const refreshLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many refresh attempts.",
});

export const googleAuthLimiter = baseLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many OAuth attempts.",
});