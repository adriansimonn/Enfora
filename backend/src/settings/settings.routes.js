import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import * as settingsController from "./settings.controller.js";
import { verificationCodeLimiter } from "../../middleware/rateLimiters.js";

const router = express.Router();

// All settings routes require authentication
router.use(requireAuth);

// Password change
router.post("/password", settingsController.changePassword);

// Notification settings
router.get("/notifications", settingsController.getNotificationSettings);
router.put("/notifications", settingsController.updateNotificationSettings);

// Account deletion - Rate limit to prevent brute force on verification codes
router.post("/account/delete/request", settingsController.requestAccountDeletion);
router.post("/account/delete/confirm", verificationCodeLimiter, settingsController.deleteAccount);

export default router;
