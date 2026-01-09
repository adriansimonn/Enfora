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
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('Webhook secret configured:', !!webhookSecret);
    console.log('Webhook secret (first 10 chars):', webhookSecret?.substring(0, 10));
    console.log('Signature present:', !!sig);

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log('✓ Webhook signature verified successfully');
      console.log('Event type:', event.type);
      console.log('Event ID:', event.id);
    } catch (err) {
      console.error('✗ Webhook signature verification FAILED:', err.message);
      console.error('Error type:', err.type);
      console.error('Error code:', err.code);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      console.log('Processing event type:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          console.log('Payment succeeded - Payment Intent ID:', paymentIntent.id);
          console.log('Amount:', paymentIntent.amount);
          console.log('Customer:', paymentIntent.customer);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            console.log('✓ Transaction found:', transaction.transactionId);
            console.log('User ID:', transaction.userId);
            console.log('Task ID:', transaction.taskId);
            await paymentService.updateTransactionStatus(transaction.transactionId, 'succeeded');
            console.log('✓ Transaction status updated to succeeded');
          } else {
            console.warn(`✗ No transaction found for payment intent ${paymentIntent.id}`);
            console.warn('This could mean the transaction was not created or the payment intent ID does not match');
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
          console.log('Payment failed - Payment Intent ID:', paymentIntent.id);
          console.log('Failure reason:', failureMessage);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            console.log('✓ Transaction found:', transaction.transactionId);
            await paymentService.updateTransactionStatus(transaction.transactionId, 'failed', {
              failureReason: failureMessage,
            });
            console.log('✓ Transaction status updated to failed');
          } else {
            console.warn(`✗ No transaction found for payment intent ${paymentIntent.id}`);
          }
          break;
        }

        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object;
          console.log('Payment canceled - Payment Intent ID:', paymentIntent.id);

          // Find and update transaction
          const transaction = await paymentService.getTransactionByPaymentIntentId(paymentIntent.id);
          if (transaction) {
            console.log('✓ Transaction found:', transaction.transactionId);
            await paymentService.updateTransactionStatus(transaction.transactionId, 'canceled');
            console.log('✓ Transaction status updated to canceled');
          }
          break;
        }

        case 'payment_method.attached': {
          console.log('Payment method attached event (no action needed)');
          break;
        }

        case 'payment_method.detached': {
          console.log('Payment method detached event (no action needed)');
          break;
        }

        default:
          console.log('Unhandled event type:', event.type);
          break;
      }

      console.log('✓ Webhook processed successfully');
      console.log('================================');
      // Return 200 to acknowledge receipt of event
      res.json({ received: true });
    } catch (error) {
      console.error('✗ Error processing webhook:', error);
      console.error('Error stack:', error.stack);
      console.error('================================');
      // Still return 200 to prevent Stripe from retrying
      res.json({ received: true, error: error.message });
    }
  }
);

module.exports = router;
