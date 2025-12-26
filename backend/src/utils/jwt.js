import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.userId,
      email: user.email,
      role: user.role || "user"
    },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.userId,
      tokenVersion: user.tokenVersion || 0
    },
    REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}