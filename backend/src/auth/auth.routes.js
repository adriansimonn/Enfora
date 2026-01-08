import express from "express";
import * as controller from "./auth.controller.js";

import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  verificationCodeLimiter,
} from "../../middleware/rateLimiters.js";

const router = express.Router();

// Credential-based endpoints (HIGH RISK)
router.post("/register", registerLimiter, controller.register);
router.post("/verify-email", verificationCodeLimiter, controller.verifyEmailCode);
router.post("/resend-code", registerLimiter, controller.resendVerificationCode);
router.post("/login", loginLimiter, controller.login);
router.post("/refresh", refreshLimiter, controller.refresh);

// Session management
router.post("/logout", controller.logout);

export default router;
