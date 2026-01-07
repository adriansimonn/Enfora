// src/auth/auth.controller.js
import * as authService from "./auth.service.js";
import { refreshSession } from "./auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from "../utils/cookies.js";
import { getGoogleAuthURL, getGoogleUser } from "./google.oauth.js";
import { googleLogin } from "./auth.service.js";
import {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  deleteVerificationCode,
} from "../db/verificationCodes.repo.js";
import { sendVerificationCode } from "../../services/emailService.js";
import * as usersRepo from "../db/users.repo.js";
import * as profilesRepo from "../db/profiles.repo.js";

export function googleRedirect(req, res) {
  res.redirect(getGoogleAuthURL());
}

export async function googleCallback(req, res) {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect("/login?error=oauth_failed");
    }

    const googleUser = await getGoogleUser(code);

    if (!googleUser.verified) {
      return res.redirect("/login?error=email_not_verified");
    }

    const { user, accessToken, refreshToken } =
      await googleLogin(googleUser);

    setRefreshTokenCookie(res, refreshToken);

    // Redirect back to frontend with access token
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${accessToken}`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/login?error=oauth_failed");
  }
}

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    const { user, accessToken, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken);

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio
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
        bio: user.bio
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const { user, accessToken, refreshToken } =
      await authService.loginUser({ email, password });

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio
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