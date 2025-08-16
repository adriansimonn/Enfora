const taskService = require("../services/taskService");

exports.createTask = async (req, res) => {
  try {
    const taskData = req.body;
    const result = await taskService.createTask(taskData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { userId } = req.query; // or req.body depending on your frontend
    const tasks = await taskService.getTasksByUser(userId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
};
