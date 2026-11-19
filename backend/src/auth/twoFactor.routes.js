// src/auth/twoFactor.routes.js
import express from "express";
import * as twoFactorController from "./twoFactor.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { verificationCodeLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/status", requireAuth, twoFactorController.get2FAStatus);
router.post("/setup/authenticator", requireAuth, twoFactorController.setupAuthenticator);
// requireAuth runs before the limiter so that failed attempts are counted per signed-in user
router.post("/setup/authenticator/verify", requireAuth, verificationCodeLimiter, twoFactorController.verifyAuthenticatorSetup);
router.post("/setup/email", requireAuth, twoFactorController.setupEmail2FA);
router.post("/disable", requireAuth, verificationCodeLimiter, twoFactorController.disable2FA);
router.post("/backup-codes/regenerate", requireAuth, twoFactorController.regenerateBackupCodes);

// Public route (for login flow). A 2FA code is only ever checked by POST /api/auth/login,
// together with the password. Do not add a route here that checks one on its own.
router.post("/send-email-code", twoFactorController.send2FAEmail);

export default router;
