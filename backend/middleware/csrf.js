const crypto = require("crypto");

/**
 * CSRF Protection Middleware using Double Submit Cookie Pattern
 *
 * This middleware protects against Cross-Site Request Forgery attacks by:
 * 1. Generating a random CSRF token on each request
 * 2. Sending it both as a cookie and requiring it in request headers
 * 3. Validating that both values match for state-changing requests
 */

// Generate a cryptographically secure random token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Middleware to generate and attach CSRF token
 * Should be applied to all routes that need CSRF protection
 */
function csrfProtection(req, res, next) {
  // For GET, HEAD, OPTIONS - just generate/refresh the token
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const token = generateToken();

    // Set CSRF token in cookie (httpOnly: false so JS can read it)
    res.cookie("XSRF-TOKEN", token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: true, // Always use secure in production
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    return next();
  }

  // For POST, PUT, DELETE, PATCH - validate the token
  const cookieToken = req.cookies["XSRF-TOKEN"];
  const headerToken = req.headers["x-xsrf-token"] || req.headers["x-csrf-token"];

  // Check if both tokens exist
  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: "CSRF token missing. Please refresh the page and try again.",
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({
      error: "CSRF token invalid. Please refresh the page and try again.",
    });
  }

  // Token is valid, proceed
  next();
}

/**
 * Middleware to skip CSRF protection for specific routes
 * Use sparingly and only for routes that have other security measures
 */
function skipCsrf(req, res, next) {
  req.skipCsrf = true;
  next();
}

module.exports = {
  csrfProtection,
  skipCsrf,
  generateToken,
};
