// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

router.post("/create-checkout-session", (req, res) => {
  const { amount } = req.body;
  res.json({ message: `Would charge $${amount} via Stripe.` });
});

module.exports = router;
