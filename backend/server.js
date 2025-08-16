const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON bodies

// Routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.send("Enfora backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const checkExpiredTasks = require("./cron/checkExpiredTasks");
setInterval(checkExpiredTasks, 60 * 60 * 1000); // Every hour
