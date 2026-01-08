// src/auth/auth.controller.js
import bcrypt from "bcrypt";
import * as authService from "./auth.service.js";
import { refreshSession } from "./auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from "../utils/cookies.js";
import {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  deleteVerificationCode,
} from "../db/verificationCodes.repo.js";
import { sendVerificationCode } from "../../services/emailService.js";
import * as usersRepo from "../db/users.repo.js";
import * as profilesRepo from "../db/profiles.repo.js";

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    const { user, accessToken, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken);

    setRefreshTokenCookie(res, newRefreshToken);

    // Get 2FA status
    const { get2FASettings } = await import("../db/users.repo.js");
    const twoFactorSettings = await get2FASettings(user.userId);

    res.json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        twoFactorEnabled: twoFactorSettings.twoFactorEnabled
      }
    });
  } catch (err) {
    clearRefreshTokenCookie(res);

    if (
      err.message === "NO_REFRESH_TOKEN" ||
      err.message === "INVALID_REFRESH_TOKEN" ||
      err.message === "REFRESH_TOKEN_REUSE"
    ) {
      return res.status(401).json({ error: "Session expired" });
    }

    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function register(req, res) {
  try {
    const { email, password, username, displayName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if email already exists
    const existingUser = await usersRepo.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!username || !usernameRegex.test(username)) {
      return res.status(400).json({
        error: "Invalid username format. Use 3-30 characters: letters, numbers, hyphens, underscores only"
      });
    }

    // Check if username is available
    const existingProfile = await profilesRepo.findProfileByUsername(username);
    if (existingProfile) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Generate and send verification code
    const code = generateVerificationCode();

    // Store verification code with user data
    await storeVerificationCode(email, code, {
      password,
      username,
      displayName: displayName || username,
    });

    // Send verification email
    await sendVerificationCode({
      email,
      verificationCode: code,
      username,
    });

    res.status(200).json({
      message: "Verification code sent to email",
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function verifyEmailCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the code
    const verification = await verifyCode(email, code);

    if (!verification.valid) {
      let errorMessage = "Invalid verification code";

      if (verification.reason === "CODE_EXPIRED") {
        errorMessage = "Verification code has expired";
      } else if (verification.reason === "CODE_NOT_FOUND") {
        errorMessage = "No verification code found for this email";
      }

      return res.status(400).json({ error: errorMessage });
    }

    // Code is valid, create the user account
    const { password, username, displayName } = verification.userData;

    const { user, accessToken, refreshToken } =
      await authService.registerUser({ email, password, username, displayName });

    // Delete the verification code
    await deleteVerificationCode(email);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        twoFactorEnabled: false,
        isNewUser: true // Flag to indicate this is a new user for 2FA setup prompt
      }
    });
  } catch (err) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ error: "Email already in use" });
    }
    if (err.message === "USERNAME_TAKEN") {
      return res.status(409).json({ error: "Username already taken" });
    }

    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function resendVerificationCode(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get existing verification data
    const { getVerificationCode } = await import("../db/verificationCodes.repo.js");
    const existingData = await getVerificationCode(email);

    if (!existingData) {
      return res.status(404).json({ error: "No pending verification found for this email" });
    }

    // Generate new code
    const code = generateVerificationCode();

    // Update with new code and reset expiration
    await storeVerificationCode(email, code, {
      password: existingData.password,
      username: existingData.username,
      displayName: existingData.displayName,
    });

    // Send new verification email
    await sendVerificationCode({
      email,
      verificationCode: code,
      username: existingData.username,
    });

    res.status(200).json({
      message: "Verification code resent to email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password, twoFactorCode, isBackupCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // First, validate credentials
    const { user, accessToken, refreshToken } =
      await authService.loginUser({ email, password });

    // Check if 2FA is enabled for this user
    const { get2FASettings } = await import("../db/users.repo.js");
    const twoFactorSettings = await get2FASettings(user.userId);

    if (twoFactorSettings.twoFactorEnabled) {
      // 2FA is enabled, check if code was provided
      if (!twoFactorCode) {
        // Return response indicating 2FA is required
        return res.status(200).json({
          requires2FA: true,
          twoFactorMethod: twoFactorSettings.twoFactorMethod,
          email: user.email
        });
      }

      // Verify the 2FA code
      const speakeasy = await import("speakeasy");
      const { verifyCode, deleteVerificationCode } = await import("../db/verificationCodes.repo.js");
      const { useBackupCode } = await import("../db/users.repo.js");

      let verified = false;

      // Check if it's a backup code (verify against hashed codes)
      if (isBackupCode) {
        const hashedCodes = twoFactorSettings.twoFactorBackupCodes;
        if (hashedCodes && Array.isArray(hashedCodes)) {
          // Check each hashed code
          for (const hashedCode of hashedCodes) {
            const isMatch = await bcrypt.compare(twoFactorCode, hashedCode);
            if (isMatch) {
              verified = true;
              // Remove the used backup code (by its hash)
              await useBackupCode(user.userId, hashedCode);
              break;
            }
          }
        }
      } else if (twoFactorSettings.twoFactorMethod === "authenticator") {
        // Verify TOTP code
        verified = speakeasy.default.totp.verify({
          secret: twoFactorSettings.twoFactorSecret,
          encoding: "base32",
          token: twoFactorCode,
          window: 2,
        });
      } else if (twoFactorSettings.twoFactorMethod === "email") {
        // Verify email code
        const verification = await verifyCode(email, twoFactorCode);
        verified = verification.valid && verification.userData?.purpose === "2FA_LOGIN";

        if (verified) {
          // Delete the used code
          await deleteVerificationCode(email);
        }
      }

      if (!verified) {
        return res.status(401).json({ error: "Invalid 2FA code" });
      }
    }

    // 2FA verified or not required, proceed with login
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        twoFactorEnabled: twoFactorSettings.twoFactorEnabled
      }
    });
  } catch (err) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function logout(req, res) {
  clearRefreshTokenCookie(res);
  res.json({ message: "Logged out" });
}