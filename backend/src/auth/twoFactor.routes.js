// src/auth/twoFactor.routes.js
import express from "express";
import * as twoFactorController from "./twoFactor.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { verificationCodeLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/status", requireAuth, twoFactorController.get2FAStatus);
router.post("/setup/authenticator", requireAuth, twoFactorController.setupAuthenticator);
router.post("/setup/authenticator/verify", verificationCodeLimiter, requireAuth, twoFactorController.verifyAuthenticatorSetup);
router.post("/setup/email", requireAuth, twoFactorController.setupEmail2FA);
router.post("/disable", verificationCodeLimiter, requireAuth, twoFactorController.disable2FA);
router.post("/backup-codes/regenerate", requireAuth, twoFactorController.regenerateBackupCodes);

// Public routes (for login flow) - CRITICAL: Rate limit to prevent brute force
router.post("/verify", verificationCodeLimiter, twoFactorController.verify2FACode);
router.post("/send-email-code", twoFactorController.send2FAEmail);

export default router;
