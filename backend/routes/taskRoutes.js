// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskService = require("../services/taskService");
const emailService = require("../services/emailService");
const { findProfileByUserId } = require("../src/db/profiles.repo.js");

// Import auth middleware (dynamic import for ES module)
let requireAuth;
import("../src/auth/auth.middleware.js").then(({ requireAuth: auth }) => {
  requireAuth = auth;
});

// Create new task (protected)
router.post("/", async (req, res) => {
  // Wait for middleware to load
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const { stakeAmount } = req.body;

      // Check if payment method is required
      if (stakeAmount && stakeAmount > 0) {
        const paymentService = require("../services/paymentService");
        const hasPayment = await paymentService.hasPaymentMethod(req.user.userId);

        if (!hasPayment) {
          return res.status(400).json({
            error: "PAYMENT_METHOD_REQUIRED",
            message: "Please add a payment method before creating tasks with stake amounts"
          });
        }
      }

      // Check 2FA requirement for $20 stake limit
      const { get2FASettings } = await import("../src/db/users.repo.js");
      const twoFactorSettings = await get2FASettings(req.user.userId);

      if (!twoFactorSettings.twoFactorEnabled) {
        // User doesn't have 2FA enabled - check stake limit
        const analyticsService = require("../services/analyticsService");
        const analytics = await analyticsService.getUserAnalytics(req.user.userId);

        const currentStakeAtRisk = analytics.totalStakeAtRisk || 0;
        const newStakeAmount = parseFloat(stakeAmount) || 0;
        const totalStakeAfterCreation = currentStakeAtRisk + newStakeAmount;

        if (totalStakeAfterCreation > 20) {
          return res.status(400).json({
            error: "2FA_REQUIRED_FOR_STAKE_LIMIT",
            message: "Enable 2FA to remove the $20 stake limit",
            currentStakeAtRisk: currentStakeAtRisk,
            attemptedStake: newStakeAmount,
            stakeLimit: 20
          });
        }
      }

      const taskData = {
        ...req.body,
        userId: req.user.userId
      };
      const task = await taskService.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });
});

// Get all tasks for authenticated user (protected)
router.get("/", async (req, res) => {
  // Wait for middleware to load
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const tasks = await taskService.getTasksByUser(req.user.userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
});

// Update task (protected)
router.put("/:taskId", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const { taskId } = req.params;
      const updatedTask = await taskService.updateTask(taskId, req.user.userId, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });
});

// Delete task (protected)
router.delete("/:taskId", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const { taskId } = req.params;
      await taskService.deleteTask(taskId, req.user.userId);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });
});

// Submit dispute for rejected task (protected)
router.post("/:taskId/dispute", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const { taskId } = req.params;
      const { disputeReasoning } = req.body;

      if (!disputeReasoning) {
        return res.status(400).json({ error: "Dispute reasoning is required" });
      }

      // Update task with dispute information and set status to review
      const updatedTask = await taskService.updateTask(taskId, req.user.userId, {
        status: "review",
        disputeReasoning,
        disputedAt: new Date().toISOString()
      });

      // Send email notification to reviewers
      try {
        // Get user profile information
        const userProfile = await findProfileByUserId(req.user.userId);

        // Extract AI rejection reason from validation result
        const aiRejectionReason = updatedTask.validationResult?.rationale || "No rejection reason available";

        // Prepare email data
        const emailData = {
          taskId: updatedTask.taskId,
          taskName: updatedTask.title,
          taskDescription: updatedTask.description,
          userId: req.user.userId,
          username: userProfile?.username || "unknown",
          displayName: userProfile?.displayName || userProfile?.username || "Unknown User",
          aiRejectionReason: aiRejectionReason,
          disputeReasoning: disputeReasoning,
          disputedAt: updatedTask.disputedAt,
          evidenceURL: updatedTask.submittedEvidenceURL || "No evidence URL available",
        };

        await emailService.sendTaskReviewNotification(emailData);
      } catch (emailError) {
        // Log email error but don't fail the dispute submission
        console.error("Failed to send review notification email:", emailError);
        // Continue with response even if email fails
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error submitting dispute:", error);
      res.status(500).json({ error: "Failed to submit dispute" });
    }
  });
});

module.exports = router;
