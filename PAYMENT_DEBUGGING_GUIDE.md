# Payment Debugging Guide

## Overview
This guide explains how to debug transaction issues in production using the comprehensive logging that has been added to the payment system.

## Payment Flow

```
1. Task Deadline Expires
   ↓
2. EventBridge triggers Lambda (expireTask)
   ↓
3. Lambda marks task as failed
   ↓
4. Lambda calls Backend API /api/payments/charge
   ↓
5. Backend creates transaction record in DynamoDB
   ↓
6. Backend creates Stripe payment intent
   ↓
7. Stripe webhook notifies backend of payment status
   ↓
8. Backend updates transaction status
```

## Log Locations

### Production Logs to Check

1. **Lambda Logs (AWS CloudWatch)**
   - Log Group: `/aws/lambda/expireTask` (or your Lambda function name)
   - Look for: `=== LAMBDA: TASK EXPIRATION HANDLER ===`

2. **Backend Logs (Vercel/Your hosting platform)**
   - Look for: `=== PAYMENT CHARGE ENDPOINT CALLED ===`
   - Look for: `=== STRIPE WEBHOOK RECEIVED ===`

3. **Stripe Dashboard**
   - Go to: Developers → Webhooks → Click your webhook
   - Check "Recent deliveries" tab for webhook events

## What to Look For in Each Stage

### Stage 1: Lambda Execution
Look for these log messages in CloudWatch:

```
=== LAMBDA: TASK EXPIRATION HANDLER ===
✓ Task found in DynamoDB
[Lambda] Task is eligible for expiration, updating status to failed...
✓ Task {taskId} marked as failed
[Lambda] Task has stake amount, initiating payment charge...
```

**Common Issues:**
- ❌ `PAYMENT_API_KEY not configured in Lambda environment variables`
  - **Fix:** Add `PAYMENT_API_KEY` to Lambda environment variables
- ❌ `Payment charge failed for task {taskId}` with status 401
  - **Fix:** Ensure `PAYMENT_API_KEY` matches between Lambda and Backend
- ❌ `Payment charge failed for task {taskId}` with connection errors
  - **Fix:** Check `BACKEND_URL` is correct (should be your production URL)

### Stage 2: Backend Payment Charge Endpoint
Look for these log messages in your backend logs:

```
=== PAYMENT CHARGE ENDPOINT CALLED ===
✓ API key validated successfully
[PaymentService] chargeFailedTask called
✓ Transaction created: {transactionId}
✓ Payment intent created: {paymentIntentId}
✓ Charge successful
```

**Common Issues:**
- ❌ `API key validation failed`
  - **Fix:** Ensure `PAYMENT_API_KEY` environment variable is set in backend
- ❌ `No Stripe customer ID found for user`
  - **Fix:** User needs to add a payment method first
- ❌ `No payment method on file for customer`
  - **Fix:** User needs to add a payment method

### Stage 3: Stripe Webhook
Look for these log messages in your backend logs:

```
=== STRIPE WEBHOOK RECEIVED ===
✓ Webhook signature verified successfully
Event type: payment_intent.succeeded
✓ Transaction found: {transactionId}
✓ Transaction status updated to succeeded
✓ Webhook processed successfully
```

**Common Issues:**
- ❌ `Webhook signature verification FAILED`
  - **Fix:** Update `STRIPE_WEBHOOK_SECRET` in backend to match new webhook
- ❌ `No transaction found for payment intent {paymentIntentId}`
  - **Fix:** Check if transaction was created properly in Stage 2

## Environment Variables Checklist

### Backend (Vercel/Production Server)
- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from new production webhook
- [ ] `PAYMENT_API_KEY` - A secure random string (same in Lambda)
- [ ] `FRONTEND_URL` - Your production frontend URL

### Lambda (AWS Lambda Environment Variables)
- [ ] `BACKEND_URL` - Your production backend URL (e.g., `https://your-api.vercel.app`)
- [ ] `PAYMENT_API_KEY` - Same value as in backend
- [ ] `AWS_REGION` - Your AWS region
- [ ] AWS credentials (usually auto-configured by Lambda)

### Stripe Webhook Configuration
- [ ] Webhook URL: `https://your-backend-url.com/api/webhooks/stripe`
- [ ] Events to send:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `payment_intent.canceled`

## Testing the Flow

### 1. Test Webhook Signature
Use Stripe CLI to send a test webhook:
```bash
stripe trigger payment_intent.succeeded
```

Check backend logs for:
```
✓ Webhook signature verified successfully
```

### 2. Test Payment Charge Endpoint
Use curl to test the charge endpoint (replace with your values):
```bash
curl -X POST https://your-backend.com/api/payments/charge \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_PAYMENT_API_KEY" \
  -d '{
    "userId": "test-user-id",
    "taskId": "test-task-id",
    "amount": 5.00
  }'
```

### 3. Create a Test Task with Stake
1. Log in to your app
2. Add a payment method (use Stripe test card: 4242 4242 4242 4242)
3. Create a task with a stake amount and a deadline in the near future
4. Wait for the deadline to pass
5. Check logs for the entire flow

## Quick Diagnosis

### No logs in Lambda at all?
- EventBridge schedule may not be configured
- Check EventBridge schedules in AWS console

### Lambda logs show charge attempt but backend has no logs?
- `BACKEND_URL` in Lambda is incorrect
- Backend is not accessible from Lambda (check VPC/networking)
- API key doesn't match

### Backend shows charge succeeded but no webhook logs?
- Webhook not configured in Stripe dashboard
- Webhook URL is incorrect
- Webhook signing secret doesn't match

### Webhook logs show signature verification failed?
- `STRIPE_WEBHOOK_SECRET` environment variable not set or incorrect
- Using development webhook secret in production (or vice versa)

### Transactions show as "pending" forever?
- Webhooks not being received
- Payment intent succeeded but webhook failed signature verification
- Check Stripe webhook dashboard for failed deliveries

## Important Notes

- **Stripe Test Mode vs Live Mode**: Ensure you're using the correct keys and webhooks for your environment
- **Webhook Secret Per Environment**: Development and production should have separate webhooks with different secrets
- **API Key Security**: The `PAYMENT_API_KEY` should be a secure random string, not easily guessable
- **DynamoDB GSI**: The system tries to use `stripePaymentIntentId-index` GSI, but falls back to scan if not available

## Next Steps After Debugging

Once you identify the issue from logs:
1. Fix the environment variable or configuration
2. If Lambda: Redeploy the Lambda function after updating environment variables
3. If Backend: Environment variables should auto-reload on next request
4. Test with a new task to verify the fix
