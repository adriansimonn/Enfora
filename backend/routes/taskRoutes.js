// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskService = require("../services/taskService");

// Create new task
router.post("/", async (req, res) => {
  try {
    const task = await taskService.createTask(req.body);
    res.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Get all tasks by userId
router.get("/:userId", async (req, res) => {
  try {
    const tasks = await taskService.getTasksByUser(req.params.userId);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

module.exports = router;
