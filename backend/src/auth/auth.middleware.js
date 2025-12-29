import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    // Map JWT 'sub' field to 'userId' for consistency
    req.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}