console.log("CWD:", process.cwd());
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json()); // For parsing JSON bodies
app.use(cookieParser()); // For parsing cookies
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Body:", req.body);
  next();
});

// Import auth routes (ES module)
import("./src/auth/auth.routes.js").then(({ default: authRoutes }) => {
  app.use("/api/auth", authRoutes);
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