const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentService = require('../services/paymentService');

// CRITICAL: This route uses express.raw() to preserve raw body for signature verification
// Must be mounted BEFORE express.json() middleware in server.js

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent ${paymentIntent.id} succeeded`);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            await paymentService.updateTransactionStatus(transaction.transactionId, 'succeeded');
            console.log(`Transaction ${transaction.transactionId} marked as succeeded`);
          } else {
            console.warn(`No transaction found for payment intent ${paymentIntent.id}`);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
          console.log(`PaymentIntent ${paymentIntent.id} failed: ${failureMessage}`);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            await paymentService.updateTransactionStatus(transaction.transactionId, 'failed', {
              failureReason: failureMessage,
            });
            console.log(`Transaction ${transaction.transactionId} marked as failed`);
          } else {
            console.warn(`No transaction found for payment intent ${paymentIntent.id}`);
          }
          break;
        }

        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent ${paymentIntent.id} was canceled`);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            await paymentService.updateTransactionStatus(transaction.transactionId, 'canceled');
            console.log(`Transaction ${transaction.transactionId} marked as canceled`);
          }
          break;
        }

        case 'payment_method.attached': {
          const paymentMethod = event.data.object;
          console.log(`PaymentMethod ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
          break;
        }

        case 'payment_method.detached': {
          const paymentMethod = event.data.object;
          console.log(`PaymentMethod ${paymentMethod.id} detached from customer`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Return 200 to acknowledge receipt of event
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to prevent Stripe from retrying
      res.json({ received: true, error: error.message });
    }
  }
);

module.exports = router;
