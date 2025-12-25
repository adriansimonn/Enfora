console.log("=== STARTING MINIMAL TEST SERVER ===");
const express = require("express");
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

// Log ALL requests
app.use((req, res, next) => {
  console.log("=================================");
  console.log("REQUEST RECEIVED!");
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  console.log("=================================");
  next();
});

// Simple test route
app.post("/api/tasks", (req, res) => {
  console.log("POST /api/tasks handler called!");
  res.json({ message: "Success!", receivedData: req.body });
});

// Catch-all for debugging
app.use("*", (req, res) => {
  console.log("Catch-all hit:", req.method, req.originalUrl);
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log("Try POST to http://localhost:5000/api/tasks");
});
