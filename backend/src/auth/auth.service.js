// src/auth/auth.service.js
import crypto from "crypto";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import * as usersRepo from "../db/users.repo.js";

/**
 * Hash refresh token before storing
 */
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function googleLogin({ googleId, email }) {
  let user = await usersRepo.findUserByEmail(email);

  // Case 1: User exists (password or Google)
  if (user) {
    // Link Google if not already linked
    if (!user.googleId) {
      await usersRepo.linkGoogleAccount(user.userId, googleId);
    }
  } else {
    // Case 2: New user
    user = {
      userId: crypto.randomUUID(),
      email,
      googleId,
      passwordHash: null,
      authProviders: ["google"],
      tokenVersion: 0,
      createdAt: Date.now()
    };

    await usersRepo.createUser(user);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    user.userId,
    hashRefreshToken(refreshToken)
  );

  return { user, accessToken, refreshToken };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const userId = payload.sub;

  const storedHash = await usersRepo.getRefreshTokenHash(userId);
  const incomingHash = hashRefreshToken(refreshToken);

  // Reuse detection
  if (!storedHash || storedHash !== incomingHash) {
    // Token reuse detected → revoke all sessions
    await usersRepo.incrementTokenVersion(userId);
    await usersRepo.clearRefreshToken(userId);
    throw new Error("REFRESH_TOKEN_REUSE");
  }

  // Token is valid → rotate
  const user = await usersRepo.findUserById(userId);

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    userId,
    hashRefreshToken(newRefreshToken)
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

export async function registerUser({ email, password }) {
  const existing = await usersRepo.findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(password);

  const user = {
    userId: crypto.randomUUID(),
    email,
    passwordHash,
    authProviders: ["password"],
    tokenVersion: 0,
    createdAt: Date.now()
  };

  await usersRepo.createUser(user);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    user.userId,
    hashRefreshToken(refreshToken)
  );

  return { user, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const user = await usersRepo.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    user.userId,
    hashRefreshToken(refreshToken)
  );

  return { user, accessToken, refreshToken };
}