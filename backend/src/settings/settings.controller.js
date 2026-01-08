// src/settings/settings.controller.js
import * as usersRepo from "../db/users.repo.js";
import * as profilesRepo from "../db/profiles.repo.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  generateVerificationCode,
  storeVerificationCode,
  verifyCode,
  deleteVerificationCode,
} from "../db/verificationCodes.repo.js";
import { sendAccountDeletionCode, sendAccountDeletionConfirmation } from "../../services/emailService.js";
import { deleteAllTasksForUser } from "../../services/taskService.js";
import { deleteUserAnalytics } from "../../services/analyticsService.js";

/**
 * Change user password
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Get user to verify current password
    const user = await usersRepo.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.passwordHash) {
      return res.status(400).json({ error: "This account uses OAuth authentication and does not have a password" });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await usersRepo.updatePassword(userId, newPasswordHash);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(req, res) {
  try {
    const userId = req.user.userId;

    const settings = await usersRepo.getNotificationSettings(userId);

    res.json(settings);
  } catch (err) {
    console.error("Error getting notification settings:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(req, res) {
  try {
    const userId = req.user.userId;
    const { emailNotifications, taskReminders, achievementAlerts } = req.body;

    // Validate input - at least one setting must be provided
    if (
      emailNotifications === undefined &&
      taskReminders === undefined &&
      achievementAlerts === undefined
    ) {
      return res.status(400).json({ error: "No settings provided" });
    }

    // Validate boolean values
    const settings = {};
    if (emailNotifications !== undefined) {
      if (typeof emailNotifications !== "boolean") {
        return res.status(400).json({ error: "emailNotifications must be a boolean" });
      }
      settings.emailNotifications = emailNotifications;
    }
    if (taskReminders !== undefined) {
      if (typeof taskReminders !== "boolean") {
        return res.status(400).json({ error: "taskReminders must be a boolean" });
      }
      settings.taskReminders = taskReminders;
    }
    if (achievementAlerts !== undefined) {
      if (typeof achievementAlerts !== "boolean") {
        return res.status(400).json({ error: "achievementAlerts must be a boolean" });
      }
      settings.achievementAlerts = achievementAlerts;
    }

    // Update settings in database
    await usersRepo.updateNotificationSettings(userId, settings);

    // Return updated settings
    const updatedSettings = await usersRepo.getNotificationSettings(userId);

    res.json({
      message: "Notification settings updated successfully",
      settings: updatedSettings,
    });
  } catch (err) {
    console.error("Error updating notification settings:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Request account deletion - sends verification code via email
 */
export async function requestAccountDeletion(req, res) {
  try {
    const userId = req.user.userId;

    // Get user data
    const user = await usersRepo.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user profile to access username
    const profile = await profilesRepo.findProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store code with userId for verification
    await storeVerificationCode(user.email, code, { userId, purpose: "account_deletion" });

    // Send deletion verification email
    await sendAccountDeletionCode({
      email: user.email,
      verificationCode: code,
      username: profile.username,
    });

    res.json({
      message: "Verification code sent to your email",
      email: user.email,
    });
  } catch (err) {
    console.error("Error requesting account deletion:", err);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Delete account - verifies code and username, then deletes all user data
 */
export async function deleteAccount(req, res) {
  try {
    const { verificationCode, username, password } = req.body;
    const userId = req.user.userId;

    // Validate input - REQUIRE password for account deletion
    if (!verificationCode || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user data
    const user = await usersRepo.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user profile to access username
    const profile = await profilesRepo.findProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Verify username matches
    if (profile.username !== username.toLowerCase()) {
      return res.status(400).json({ error: "Username does not match" });
    }

    // SECURITY: Verify password before allowing account deletion
    if (!user.passwordHash) {
      return res.status(400).json({ error: "Cannot delete OAuth-only accounts this way" });
    }

    const { verifyPassword } = await import("../utils/password.js");
    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Verify the email verification code
    const verification = await verifyCode(user.email, verificationCode);

    if (!verification.valid) {
      let errorMessage = "Invalid verification code";

      if (verification.reason === "CODE_EXPIRED") {
        errorMessage = "Verification code has expired";
      } else if (verification.reason === "CODE_NOT_FOUND") {
        errorMessage = "No verification code found";
      } else if (verification.reason === "CODE_MISMATCH") {
        errorMessage = "Incorrect verification code";
      }

      return res.status(400).json({ error: errorMessage });
    }

    // Verify the code was for account deletion
    if (verification.userData.purpose !== "account_deletion") {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Verify the userId matches
    if (verification.userData.userId !== userId) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Delete verification code
    await deleteVerificationCode(user.email);

    // Send goodbye email before deleting the account
    try {
      await sendAccountDeletionConfirmation({
        email: user.email,
        username: profile.username,
      });
    } catch (emailErr) {
      console.error("Error sending goodbye email:", emailErr);
      // Continue with deletion even if email fails
    }

    // Delete user data from all tables
    // 1. Delete all tasks
    try {
      await deleteAllTasksForUser(userId);
    } catch (err) {
      console.error("Error deleting tasks:", err);
      // Continue even if task deletion fails
    }

    // 2. Delete analytics
    try {
      await deleteUserAnalytics(userId);
    } catch (err) {
      console.error("Error deleting analytics:", err);
      // Continue even if analytics deletion fails
    }

    // 3. Delete profile
    try {
      await profilesRepo.deleteProfile(profile.username);
    } catch (err) {
      console.error("Error deleting profile:", err);
      // Continue even if profile deletion fails
    }

    // 4. Delete user (this should be last as it contains authentication data)
    await usersRepo.deleteUser(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ error: "Server error" });
  }
}
