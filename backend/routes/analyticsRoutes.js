const express = require("express");
const router = express.Router();
const analyticsService = require("../services/analyticsService");

// Import auth middleware (dynamic import for ES module)
let requireAuth;
import("../src/auth/auth.middleware.js").then(({ requireAuth: auth }) => {
  requireAuth = auth;
});

// Get analytics for authenticated user
router.get("/", async (req, res) => {
  // Wait for middleware to load
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const analytics = await analyticsService.getUserAnalytics(req.user.sub);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
});

// Refresh analytics for authenticated user
router.post("/refresh", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const analytics = await analyticsService.refreshUserAnalytics(req.user.sub);
      res.json(analytics);
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      res.status(500).json({ error: "Failed to refresh analytics" });
    }
  });
});

module.exports = router;
