const express = require("express");
const router = express.Router();
const leaderboardService = require("../services/leaderboardService");

// Import auth middleware (for optional authenticated user rank)
let requireAuth;
import("../src/auth/auth.middleware.js").then(({ requireAuth: auth }) => {
  requireAuth = auth;
});

/**
 * GET /api/leaderboard/top100
 * Public route - get top 100 users
 */
router.get("/top100", async (req, res) => {
  try {
    const result = await leaderboardService.getTop100();

    // Cache for 5 minutes on client
    res.set('Cache-Control', 'public, max-age=300');
    res.json(result);
  } catch (error) {
    console.error("Error fetching top 100:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /api/leaderboard/rank/:userId
 * Public route - get specific user's rank
 */
router.get("/rank/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const rank = await leaderboardService.getUserRank(userId);

    if (!rank) {
      return res.status(404).json({ error: "User not found or has no ranking" });
    }

    res.json(rank);
  } catch (error) {
    console.error("Error fetching user rank:", error);
    res.status(500).json({ error: "Failed to fetch user rank" });
  }
});

/**
 * GET /api/leaderboard/me
 * Authenticated route - get current user's rank
 */
router.get("/me", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const rank = await leaderboardService.getUserRank(req.user.userId);

      if (!rank) {
        return res.status(404).json({
          error: "You don't have a ranking yet. Complete tasks to earn a reliability score!"
        });
      }

      res.json(rank);
    } catch (error) {
      console.error("Error fetching user rank:", error);
      res.status(500).json({ error: "Failed to fetch your rank" });
    }
  });
});

module.exports = router;
