// src/auth/auth.service.js
import crypto from "crypto";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import * as usersRepo from "../db/users.repo.js";
import * as profilesRepo from "../db/profiles.repo.js";

/**
 * Hash refresh token before storing
 */
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
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

  // Get user's profile to include username, displayName and profile picture
  const profile = await profilesRepo.findProfileByUserId(user.userId);
  if (profile) {
    user.username = profile.username;
    user.displayName = profile.displayName;
    user.profilePictureUrl = profile.profilePictureUrl || null;
    user.bio = profile.bio || '';
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    userId,
    hashRefreshToken(newRefreshToken)
  );

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

export async function registerUser({ email, password, username, displayName }) {
  const existing = await usersRepo.findUserByEmail(email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!username || !usernameRegex.test(username)) {
    throw new Error("INVALID_USERNAME_FORMAT");
  }

  // Check if username is available
  const existingProfile = await profilesRepo.findProfileByUsername(username);
  if (existingProfile) {
    throw new Error("USERNAME_TAKEN");
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

  // Create user profile
  await profilesRepo.createProfile({
    username: username.toLowerCase(),
    userId: user.userId,
    displayName: displayName || username,
    bio: "",
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    user.userId,
    hashRefreshToken(refreshToken)
  );

  // Add username, displayName and profilePictureUrl to user object for response
  user.username = username.toLowerCase();
  user.displayName = displayName || username;
  user.profilePictureUrl = null;
  user.bio = '';

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

  // Get user's profile to include username, displayName and profile picture
  const profile = await profilesRepo.findProfileByUserId(user.userId);
  if (profile) {
    user.username = profile.username;
    user.displayName = profile.displayName;
    user.profilePictureUrl = profile.profilePictureUrl || null;
    user.bio = profile.bio || '';
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await usersRepo.updateRefreshToken(
    user.userId,
    hashRefreshToken(refreshToken)
  );

  return { user, accessToken, refreshToken };
}