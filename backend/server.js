console.log("CWD:", process.cwd());
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing JSON bodies

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Body:", req.body);
  next();
});

// Routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

const evidenceRoutes = require("./routes/evidenceRoutes");
app.use("/api/evidence", evidenceRoutes);

app.get("/", (req, res) => {
  res.send("Enfora backend is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error caught by middleware:", err);
  res.status(500).json({ error: err.message });
});

// Start server (only once!)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const checkExpiredTasks = require("./cron/checkExpiredTasks");
setInterval(checkExpiredTasks, 60 * 60 * 1000); // Every hour