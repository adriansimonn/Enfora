const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { csrfProtection } = require("./middleware/csrf");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: Log environment on startup
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('PORT:', process.env.PORT);
console.log('============================');

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log('CORS Check - Request Origin:', origin);
    console.log('CORS Check - Allowed Origin:', allowedOrigin);

    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log('CORS Check - No origin, allowing');
      return callback(null, true);
    }

    if (origin === allowedOrigin) {
      console.log('CORS Check - Origin matches, allowing');
      callback(null, true);
    } else {
      console.log('CORS Check - Origin does NOT match, rejecting');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-Token', 'X-CSRF-Token'],
};

console.log('CORS Configuration initialized with dynamic origin check');

app.use(cors(corsOptions));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Origin:', req.headers.origin);
  console.log('CORS allowed origin:', process.env.FRONTEND_URL || "http://localhost:5173");
  next();
});

// CRITICAL: Mount webhook routes BEFORE express.json() to preserve raw body for signature verification
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/api/webhooks", webhookRoutes);

// Now add JSON middleware for all other routes
app.use(express.json()); // For parsing JSON bodies
app.use(cookieParser()); // For parsing cookies
app.use(express.urlencoded({ extended: true }));

// CSRF Protection - TEMPORARILY DISABLED for cross-origin setup
// TODO: Implement proper CSRF protection for cross-origin (e.g., custom header or CORS-based protection)
// Webhooks are exempt because they use signature verification instead
// app.use(csrfProtection);

// Initialize server asynchronously to load ES module routes
async function initializeServer() {
  // Import auth routes (ES module)
  const { default: authRoutes } = await import("./src/auth/auth.routes.js");
  app.use("/api/auth", authRoutes);

  // Import profile routes (ES module)
  const { default: profileRoutes } = await import("./src/profile/profile.routes.js");
  app.use("/api/profile", profileRoutes);

  // Import settings routes (ES module)
  const { default: settingsRoutes } = await import("./src/settings/settings.routes.js");
  app.use("/api/settings", settingsRoutes);

  // Import 2FA routes (ES module)
  const { default: twoFactorRoutes } = await import("./src/auth/twoFactor.routes.js");
  app.use("/api/2fa", twoFactorRoutes);

  // Routes
  const taskRoutes = require("./routes/taskRoutes");
  app.use("/api/tasks", taskRoutes);

  const evidenceRoutes = require("./routes/evidenceRoutes");
  app.use("/api/evidence", evidenceRoutes);

  const analyticsRoutes = require("./routes/analyticsRoutes");
  app.use("/api/analytics", analyticsRoutes);

  const leaderboardRoutes = require("./routes/leaderboardRoutes");
  app.use("/api/leaderboard", leaderboardRoutes);

  const paymentRoutes = require("./routes/paymentRoutes");
  app.use("/api/payments", paymentRoutes);

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
}

// Initialize the server
initializeServer().catch((err) => {
  console.error("Failed to initialize server:", err);
  process.exit(1);
});