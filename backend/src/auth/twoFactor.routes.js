// src/auth/twoFactor.routes.js
import express from "express";
import * as twoFactorController from "./twoFactor.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/status", requireAuth, twoFactorController.get2FAStatus);
router.post("/setup/authenticator", requireAuth, twoFactorController.setupAuthenticator);
router.post("/setup/authenticator/verify", requireAuth, twoFactorController.verifyAuthenticatorSetup);
router.post("/setup/email", requireAuth, twoFactorController.setupEmail2FA);
router.post("/disable", requireAuth, twoFactorController.disable2FA);
router.post("/backup-codes/regenerate", requireAuth, twoFactorController.regenerateBackupCodes);

// Public routes (for login flow)
router.post("/verify", twoFactorController.verify2FACode);
router.post("/send-email-code", twoFactorController.send2FAEmail);

export default router;
