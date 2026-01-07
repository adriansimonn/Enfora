import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import * as settingsController from "./settings.controller.js";

const router = express.Router();

// All settings routes require authentication
router.use(requireAuth);

// Password change
router.post("/password", settingsController.changePassword);

// Notification settings
router.get("/notifications", settingsController.getNotificationSettings);
router.put("/notifications", settingsController.updateNotificationSettings);

// Account deletion
router.post("/account/delete/request", settingsController.requestAccountDeletion);
router.post("/account/delete/confirm", settingsController.deleteAccount);

export default router;
