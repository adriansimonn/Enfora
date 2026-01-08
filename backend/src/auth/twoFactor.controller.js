// src/auth/twoFactor.controller.js
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import * as usersRepo from "../db/users.repo.js";
import {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  deleteVerificationCode,
} from "../db/verificationCodes.repo.js";
import { send2FACode } from "../../services/emailService.js";

/**
 * Generate backup codes for 2FA
 */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Setup authenticator app 2FA - Step 1: Generate secret and QR code
 */
export async function setupAuthenticator(req, res) {
  try {
    const userId = req.user.userId;
    const email = req.user.email;

    // Check if 2FA is already enabled
    const twoFactorSettings = await usersRepo.get2FASettings(userId);
    if (twoFactorSettings.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is already enabled" });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Enfora (${email})`,
      issuer: "Enfora",
      length: 32,
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (we'll confirm it in the next step)
    // Store in verification codes table with 30-minute expiration
    await storeVerificationCode(email, "TEMP_SECRET", {
      tempSecret: secret.base32,
      purpose: "2FA_SETUP_AUTHENTICATOR",
    });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      backupCodes: generateBackupCodes(),
    });
  } catch (error) {
    console.error("Error setting up authenticator:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Verify and complete authenticator app 2FA setup - Step 2
 */
export async function verifyAuthenticatorSetup(req, res) {
  try {
    const userId = req.user.userId;
    const email = req.user.email;
    const { code, backupCodes } = req.body;

    if (!code || !backupCodes || !Array.isArray(backupCodes)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get the temporary secret
    const { getVerificationCode } = await import("../db/verificationCodes.repo.js");
    const tempData = await getVerificationCode(email);

    if (!tempData || tempData.purpose !== "2FA_SETUP_AUTHENTICATOR") {
      return res.status(400).json({ error: "No pending authenticator setup found" });
    }

    const secret = tempData.tempSecret;

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: 2, // Allow 2 time steps before/after for clock skew
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Save 2FA settings
    await usersRepo.update2FASettings(userId, {
      twoFactorEnabled: true,
      twoFactorMethod: "authenticator",
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
    });

    // Clean up temporary secret
    await deleteVerificationCode(email);

    res.json({
      message: "Authenticator 2FA enabled successfully",
      method: "authenticator",
    });
  } catch (error) {
    console.error("Error verifying authenticator setup:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Setup email-based 2FA
 */
export async function setupEmail2FA(req, res) {
  try {
    const userId = req.user.userId;
    const email = req.user.email;

    // Check if 2FA is already enabled
    const twoFactorSettings = await usersRepo.get2FASettings(userId);
    if (twoFactorSettings.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is already enabled" });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Save 2FA settings
    await usersRepo.update2FASettings(userId, {
      twoFactorEnabled: true,
      twoFactorMethod: "email",
      twoFactorSecret: null, // Email method doesn't need a secret
      twoFactorBackupCodes: backupCodes,
    });

    res.json({
      message: "Email 2FA enabled successfully",
      method: "email",
      backupCodes: backupCodes,
    });
  } catch (error) {
    console.error("Error setting up email 2FA:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Disable 2FA
 */
export async function disable2FA(req, res) {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to disable 2FA" });
    }

    // Verify password
    const user = await usersRepo.findUserById(userId);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { verifyPassword } = await import("../utils/password.js");
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Disable 2FA
    await usersRepo.disable2FA(userId);

    res.json({ message: "2FA disabled successfully" });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get 2FA status
 */
export async function get2FAStatus(req, res) {
  try {
    const userId = req.user.userId;
    const twoFactorSettings = await usersRepo.get2FASettings(userId);

    res.json({
      twoFactorEnabled: twoFactorSettings.twoFactorEnabled,
      twoFactorMethod: twoFactorSettings.twoFactorMethod,
      hasBackupCodes: twoFactorSettings.twoFactorBackupCodes?.length > 0,
      backupCodesCount: twoFactorSettings.twoFactorBackupCodes?.length || 0,
    });
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Verify 2FA code during login
 */
export async function verify2FACode(req, res) {
  try {
    const { email, code, isBackupCode } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user by email
    const user = await usersRepo.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const twoFactorSettings = await usersRepo.get2FASettings(user.userId);

    if (!twoFactorSettings.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is not enabled for this account" });
    }

    let verified = false;

    // Check if it's a backup code
    if (isBackupCode) {
      if (twoFactorSettings.twoFactorBackupCodes?.includes(code)) {
        verified = true;
        // Remove the used backup code
        await usersRepo.useBackupCode(user.userId, code);
      }
    } else if (twoFactorSettings.twoFactorMethod === "authenticator") {
      // Verify TOTP code
      verified = speakeasy.totp.verify({
        secret: twoFactorSettings.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 2,
      });
    } else if (twoFactorSettings.twoFactorMethod === "email") {
      // Verify email code
      const verification = await verifyCode(email, code);
      verified = verification.valid && verification.userData?.purpose === "2FA_LOGIN";

      if (verified) {
        // Delete the used code
        await deleteVerificationCode(email);
      }
    }

    if (!verified) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Return success - the login controller will handle token generation
    res.json({ verified: true });
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Send 2FA code via email (for email-based 2FA during login)
 */
export async function send2FAEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get user by email
    const user = await usersRepo.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: "If 2FA is enabled, a code has been sent" });
    }

    const twoFactorSettings = await usersRepo.get2FASettings(user.userId);

    if (!twoFactorSettings.twoFactorEnabled || twoFactorSettings.twoFactorMethod !== "email") {
      // Don't reveal 2FA status
      return res.json({ message: "If 2FA is enabled, a code has been sent" });
    }

    // Generate and send 2FA code
    const code = generateVerificationCode();
    await storeVerificationCode(email, code, { purpose: "2FA_LOGIN" });
    await send2FACode({ email, verificationCode: code });

    res.json({ message: "2FA code sent to your email" });
  } catch (error) {
    console.error("Error sending 2FA email:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(req, res) {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Verify password
    const user = await usersRepo.findUserById(userId);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { verifyPassword } = await import("../utils/password.js");
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Check if 2FA is enabled
    const twoFactorSettings = await usersRepo.get2FASettings(userId);
    if (!twoFactorSettings.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA is not enabled" });
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();

    // Update backup codes
    await usersRepo.update2FASettings(userId, {
      twoFactorBackupCodes: backupCodes,
    });

    res.json({
      message: "Backup codes regenerated successfully",
      backupCodes: backupCodes,
    });
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    res.status(500).json({ error: "Server error" });
  }
}
