// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskService = require("../services/taskService");

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

      res.json(updatedTask);
    } catch (error) {
      console.error("Error submitting dispute:", error);
      res.status(500).json({ error: "Failed to submit dispute" });
    }
  });
});

module.exports = router;
