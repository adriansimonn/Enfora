// src/auth/auth.controller.js
import * as authService from "./auth.service.js";
import { refreshSession } from "./auth.service.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from "../utils/cookies.js";
import { getGoogleAuthURL, getGoogleUser } from "./google.oauth.js";
import { googleLogin } from "./auth.service.js";

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
        username: user.username
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

    const { user, accessToken, refreshToken } =
      await authService.registerUser({ email, password, username, displayName });

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username
      }
    });
  } catch (err) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ error: "Email already in use" });
    }
    if (err.message === "USERNAME_TAKEN") {
      return res.status(409).json({ error: "Username already taken" });
    }
    if (err.message === "INVALID_USERNAME_FORMAT") {
      return res.status(400).json({
        error: "Invalid username format. Use 3-30 characters: letters, numbers, hyphens, underscores only"
      });
    }

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
        username: user.username
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