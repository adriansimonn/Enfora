const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

/**
 * Create a Stripe customer for a user
 * @param {string} userId - User's unique ID
 * @param {string} email - User's email address
 * @returns {Promise<string>} Stripe customer ID
 */
async function createStripeCustomer(userId, email) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create payment customer');
  }
}

/**
 * Get Stripe customer details
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Customer object
 */
async function getStripeCustomer(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw new Error('Failed to retrieve customer details');
  }
}

/**
 * Create a SetupIntent for collecting payment method
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<string>} Client secret for frontend
 */
async function createSetupIntent(customerId) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    return setupIntent.client_secret;
  } catch (error) {
    console.error('Error creating SetupIntent:', error);
    throw new Error('Failed to create payment setup');
  }
}

/**
 * Attach payment method to customer and set as default
 * @param {string} paymentMethodId - Stripe payment method ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Payment method object
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  try {
    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return paymentMethod;
  } catch (error) {
    console.error('Error attaching payment method:', error);
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error('Invalid payment method');
    }
    throw new Error('Failed to save payment method');
  }
}

/**
 * Get customer's default payment method
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object|null>} Payment method details or null
 */
async function getDefaultPaymentMethod(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethodId) {
      return null;
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

    return {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
    };
  } catch (error) {
    console.error('Error retrieving default payment method:', error);
    return null;
  }
}

/**
 * Detach payment method from customer
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<void>}
 */
async function detachPaymentMethod(paymentMethodId) {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw new Error('Failed to remove payment method');
  }
}

/**
 * Create and confirm a payment intent
 * @param {number} amount - Amount in cents
 * @param {string} customerId - Stripe customer ID
 * @param {Object} metadata - Additional metadata (userId, taskId)
 * @returns {Promise<Object>} Payment intent object
 */
async function createPaymentIntent(amount, customerId, metadata = {}) {
  try {
    console.log('[StripeService] Creating payment intent...');
    const idempotencyKey = crypto.randomUUID();
    console.log('  Idempotency key:', idempotencyKey);
    console.log('  Amount:', amount);
    console.log('  Customer ID:', customerId);
    console.log('  Metadata:', JSON.stringify(metadata, null, 2));

    // Get customer's default payment method
    console.log('[StripeService] Retrieving customer from Stripe...');
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

    console.log('  Customer email:', customer.email);
    console.log('  Default payment method ID:', defaultPaymentMethod);

    if (!defaultPaymentMethod) {
      console.error('[StripeService] No default payment method found for customer');
      throw new Error('No payment method available');
    }

    console.log('[StripeService] Creating payment intent with Stripe API...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency: 'usd',
      customer: customerId,
      payment_method: defaultPaymentMethod, // Specify the payment method
      confirm: true, // Immediately confirm the payment
      off_session: true, // Payment without customer being present
      metadata: {
        ...metadata,
        idempotencyKey,
      },
    }, {
      idempotencyKey, // Prevent duplicate charges
    });

    console.log('✓ Payment intent created successfully');
    console.log('  Payment Intent ID:', paymentIntent.id);
    console.log('  Status:', paymentIntent.status);
    console.log('  Amount:', paymentIntent.amount);

    return paymentIntent;
  } catch (error) {
    console.error('[StripeService] Error creating payment intent:', error);
    console.error('  Error type:', error.type);
    console.error('  Error code:', error.code);
    console.error('  Error message:', error.message);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      console.error('[StripeService] Card error - decline code:', error.decline_code);
      throw new Error(error.message); // User-friendly card error
    } else if (error.code === 'payment_method_not_available') {
      console.error('[StripeService] Payment method not available');
      throw new Error('No payment method available');
    }

    console.error('[StripeService] Generic payment processing error');
    throw new Error('Payment processing failed');
  }
}

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment intent object
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw new Error('Failed to retrieve payment details');
  }
}

module.exports = {
  createStripeCustomer,
  getStripeCustomer,
  createSetupIntent,
  attachPaymentMethod,
  getDefaultPaymentMethod,
  detachPaymentMethod,
  createPaymentIntent,
  getPaymentIntent,
};
