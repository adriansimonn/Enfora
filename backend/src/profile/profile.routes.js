import express from "express";
import multer from "multer";
import { requireAuth } from "../auth/auth.middleware.js";
import * as profileController from "./profile.controller.js";

const router = express.Router();

// Configure multer for memory storage (files stored in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Public route - get profile by username
router.get("/:username", profileController.getProfile);

// Public route - check username availability
router.get("/check-username/:username", profileController.checkUsername);

// Protected routes - require authentication
router.get("/user/:userId", requireAuth, profileController.getProfileByUserId);
router.put("/:username", requireAuth, profileController.updateProfile);
// Note: updateTags endpoint removed - tags should only be modified by:
// 1. System automatically when reliability score changes
// 2. Developers with direct database access
// Users should NOT be able to modify their own or others' tags
router.post(
  "/:username/picture",
  requireAuth,
  upload.single("profilePicture"),
  profileController.uploadProfilePicture
);
router.delete("/:username/picture", requireAuth, profileController.deleteProfilePicture);

export default router;
