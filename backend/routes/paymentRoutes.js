// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentService = require("../services/paymentService");
const stripeService = require("../services/stripeService");
const { skipCsrf } = require("../middleware/csrf");

// Import rate limiters
let paymentLimiter, paymentChargeLimiter;
import("../middleware/rateLimiters.js").then((module) => {
  paymentLimiter = module.paymentLimiter;
  paymentChargeLimiter = module.paymentChargeLimiter;
});

// Import auth middleware (dynamic import for ES module)
let requireAuth;
import("../src/auth/auth.middleware.js").then(({ requireAuth: auth }) => {
  requireAuth = auth;
});

/**
 * GET /api/payments/methods
 * Get user's current payment method
 */
router.get("/methods", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const paymentMethod = await paymentService.getUserPaymentMethod(req.user.userId);

      if (!paymentMethod) {
        return res.json({ paymentMethod: null });
      }

      res.json({ paymentMethod });
    } catch (error) {
      console.error("Error getting payment method:", error);
      res.status(500).json({
        error: "PAYMENT_METHOD_ERROR",
        message: "Failed to retrieve payment method",
      });
    }
  });
});

/**
 * POST /api/payments/setup-intent
 * Create SetupIntent for collecting payment method
 */
router.post("/setup-intent", async (req, res) => {
  if (!requireAuth || !paymentLimiter) {
    return res.status(500).json({ error: "Server initializing" });
  }

  paymentLimiter(req, res, () => {
    requireAuth(req, res, async () => {
    try {
      const { getStripeCustomerId } = await import("../src/db/users.repo.js");
      const { findUserById } = await import("../src/db/users.repo.js");

      let stripeCustomerId = await getStripeCustomerId(req.user.userId);

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const user = await findUserById(req.user.userId);
        if (!user) {
          return res.status(404).json({
            error: "USER_NOT_FOUND",
            message: "User not found",
          });
        }

        stripeCustomerId = await stripeService.createStripeCustomer(req.user.userId, user.email);
        const { updateStripeCustomerId } = await import("../src/db/users.repo.js");
        await updateStripeCustomerId(req.user.userId, stripeCustomerId);
      }

      const clientSecret = await stripeService.createSetupIntent(stripeCustomerId);

      res.json({ clientSecret });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({
        error: "SETUP_INTENT_ERROR",
        message: "Failed to create payment setup",
      });
    }
    });
  });
});

/**
 * POST /api/payments/methods
 * Save payment method to user account
 */
router.post("/methods", async (req, res) => {
  if (!requireAuth || !paymentLimiter) {
    return res.status(500).json({ error: "Server initializing" });
  }

  paymentLimiter(req, res, () => {
    requireAuth(req, res, async () => {
    try {
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: "Payment method ID is required",
        });
      }

      const { findUserById } = await import("../src/db/users.repo.js");
      const user = await findUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          error: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      const paymentMethod = await paymentService.addPaymentMethod(
        req.user.userId,
        user.email,
        paymentMethodId
      );

      res.json({ paymentMethod });
    } catch (error) {
      console.error("Error saving payment method:", error);
      res.status(500).json({
        error: "PAYMENT_METHOD_ERROR",
        message: error.message || "Failed to save payment method",
      });
    }
    });
  });
});

/**
 * DELETE /api/payments/methods
 * Remove user's payment method
 */
router.delete("/methods", async (req, res) => {
  if (!requireAuth || !paymentLimiter) {
    return res.status(500).json({ error: "Server initializing" });
  }

  paymentLimiter(req, res, () => {
    requireAuth(req, res, async () => {
      try {
        await paymentService.removePaymentMethod(req.user.userId);

        res.json({ success: true });
      } catch (error) {
        console.error("Error removing payment method:", error);
        res.status(500).json({
          error: "PAYMENT_METHOD_ERROR",
          message: error.message || "Failed to remove payment method",
        });
      }
    });
  });
});

/**
 * GET /api/payments/history
 * Get user's transaction history
 */
router.get("/history", async (req, res) => {
  if (!requireAuth) {
    return res.status(500).json({ error: "Server initializing" });
  }

  requireAuth(req, res, async () => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const lastKey = req.query.lastKey ? JSON.parse(req.query.lastKey) : null;

      const result = await paymentService.getTransactionsByUserId(
        req.user.userId,
        limit,
        lastKey
      );

      res.json(result);
    } catch (error) {
      console.error("Error getting payment history:", error);
      res.status(500).json({
        error: "HISTORY_ERROR",
        message: "Failed to retrieve payment history",
      });
    }
  });
});

/**
 * POST /api/payments/charge
 * Internal endpoint to charge user for failed task
 * Requires API key authentication
 * Skip CSRF since this uses API key authentication instead
 */
router.post("/charge", skipCsrf, async (req, res) => {
  if (!paymentChargeLimiter) {
    return res.status(500).json({ error: "Server initializing" });
  }

  paymentChargeLimiter(req, res, async () => {
  try {
    console.log('=== PAYMENT CHARGE ENDPOINT CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate API key for internal requests
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.PAYMENT_API_KEY;

    console.log('API Key present:', !!apiKey);
    console.log('Expected API Key configured:', !!expectedApiKey);
    console.log('API Key match:', apiKey === expectedApiKey);

    if (apiKey !== expectedApiKey) {
      console.error('✗ API key validation failed');
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }

    console.log('✓ API key validated successfully');

    const { userId, taskId, amount } = req.body;

    if (!userId || !taskId || !amount) {
      console.error('✗ Missing required fields:', { userId: !!userId, taskId: !!taskId, amount: !!amount });
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "userId, taskId, and amount are required",
      });
    }

    console.log('Processing charge for:');
    console.log('  User ID:', userId);
    console.log('  Task ID:', taskId);
    console.log('  Amount: $' + amount);

    const result = await paymentService.chargeFailedTask(userId, taskId, amount);

    console.log('Charge result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✓ Charge successful');
      console.log('  Transaction ID:', result.transaction?.transactionId);
      console.log('  Status:', result.transaction?.status);
      console.log('  Payment Intent ID:', result.transaction?.stripePaymentIntentId);
      console.log('================================');
      res.json({
        success: true,
        transaction: result.transaction,
      });
    } else {
      console.log('✗ Charge failed:', result.error);
      console.log('  Transaction ID:', result.transaction?.transactionId);
      console.log('================================');
      res.status(400).json({
        success: false,
        error: result.error,
        transaction: result.transaction,
      });
    }
  } catch (error) {
    console.error("✗ Error charging failed task:", error);
    console.error('Error stack:', error.stack);
    console.error('================================');
    res.status(500).json({
      error: "CHARGE_ERROR",
      message: "Failed to process charge",
    });
  }
  });
});

module.exports = router;
