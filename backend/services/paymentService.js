const stripeService = require('./stripeService');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { findUserById, updateStripeCustomerId, getStripeCustomerId } = require('../src/db/users.repo.js');
const crypto = require('crypto');

// DynamoDB client setup
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

const TRANSACTIONS_TABLE = 'Transactions';

/**
 * Get user's payment method
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Payment method details or null
 */
async function getUserPaymentMethod(userId) {
  try {
    const stripeCustomerId = await getStripeCustomerId(userId);

    if (!stripeCustomerId) {
      return null;
    }

    const paymentMethod = await stripeService.getDefaultPaymentMethod(stripeCustomerId);
    return paymentMethod;
  } catch (error) {
    console.error('Error getting user payment method:', error);
    throw new Error('Failed to retrieve payment method');
  }
}

/**
 * Add payment method to user account
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} Payment method details
 */
async function addPaymentMethod(userId, email, paymentMethodId) {
  try {
    let stripeCustomerId = await getStripeCustomerId(userId);

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      stripeCustomerId = await stripeService.createStripeCustomer(userId, email);
      await updateStripeCustomerId(userId, stripeCustomerId);
    }

    // Attach payment method to customer
    const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);

    return {
      id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      expMonth: paymentMethod.card.exp_month,
      expYear: paymentMethod.card.exp_year,
    };
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
}

/**
 * Remove user's payment method
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function removePaymentMethod(userId) {
  try {
    const stripeCustomerId = await getStripeCustomerId(userId);

    if (!stripeCustomerId) {
      throw new Error('No payment method found');
    }

    const paymentMethod = await stripeService.getDefaultPaymentMethod(stripeCustomerId);

    if (!paymentMethod) {
      throw new Error('No payment method found');
    }

    await stripeService.detachPaymentMethod(paymentMethod.id);
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
}

/**
 * Check if user has a payment method
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if payment method exists
 */
async function hasPaymentMethod(userId) {
  try {
    const paymentMethod = await getUserPaymentMethod(userId);
    return paymentMethod !== null;
  } catch (error) {
    console.error('Error checking payment method:', error);
    return false;
  }
}

/**
 * Create a transaction record
 * @param {Object} data - Transaction data
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction(data) {
  try {
    const transaction = {
      transactionId: crypto.randomUUID(),
      userId: data.userId,
      taskId: data.taskId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      amount: data.amount,
      status: data.status || 'pending',
      failureReason: data.failureReason || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDB.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: transaction,
    }));

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction record');
  }
}

/**
 * Update transaction status
 * @param {string} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Updated transaction
 */
async function updateTransactionStatus(transactionId, status, metadata = {}) {
  try {
    const result = await dynamoDB.send(new UpdateCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: { transactionId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, failureReason = :failureReason',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
        ':failureReason': metadata.failureReason || null,
      },
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw new Error('Failed to update transaction');
  }
}

/**
 * Get transactions by user ID
 * @param {string} userId - User ID
 * @param {number} limit - Number of transactions to retrieve
 * @param {string} lastKey - Last evaluated key for pagination
 * @returns {Promise<Object>} Transactions and pagination info
 */
async function getTransactionsByUserId(userId, limit = 20, lastKey = null) {
  try {
    const params = {
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt DESC
      Limit: limit,
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    const result = await dynamoDB.send(new QueryCommand(params));

    // Enrich transactions with task titles
    const transactions = result.Items || [];
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.taskId) {
          try {
            // Fetch task details to get the title
            const taskResult = await dynamoDB.send(new GetCommand({
              TableName: 'Tasks',
              Key: { taskId: transaction.taskId },
            }));

            if (taskResult.Item) {
              return {
                ...transaction,
                taskTitle: taskResult.Item.title,
              };
            }
          } catch (error) {
            console.error(`Error fetching task ${transaction.taskId}:`, error);
          }
        }
        return transaction;
      })
    );

    return {
      transactions: enrichedTransactions,
      lastKey: result.LastEvaluatedKey || null,
      hasMore: !!result.LastEvaluatedKey,
    };
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw new Error('Failed to retrieve transaction history');
  }
}

/**
 * Get transaction by ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object|null>} Transaction or null
 */
async function getTransactionById(transactionId) {
  try {
    const result = await dynamoDB.send(new GetCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: { transactionId },
    }));

    return result.Item || null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

/**
 * Find transaction by Stripe payment intent ID
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object|null>} Transaction or null
 */
async function getTransactionByPaymentIntentId(paymentIntentId) {
  try {
    const result = await dynamoDB.send(new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'stripePaymentIntentId-index', // Note: This GSI would need to be created
      KeyConditionExpression: 'stripePaymentIntentId = :pid',
      ExpressionAttributeValues: {
        ':pid': paymentIntentId,
      },
      Limit: 1,
    }));

    return result.Items?.[0] || null;
  } catch (error) {
    // If index doesn't exist, fall back to scan (inefficient but works for MVP)
    console.warn('stripePaymentIntentId-index not found, using scan');
    try {
      const scanResult = await dynamoDB.send(new QueryCommand({
        TableName: TRANSACTIONS_TABLE,
        FilterExpression: 'stripePaymentIntentId = :pid',
        ExpressionAttributeValues: {
          ':pid': paymentIntentId,
        },
      }));
      return scanResult.Items?.[0] || null;
    } catch (scanError) {
      console.error('Error scanning for transaction:', scanError);
      return null;
    }
  }
}

/**
 * Charge user for failed task
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {number} amount - Amount in dollars
 * @returns {Promise<Object>} Result object { success, transaction, error }
 */
async function chargeFailedTask(userId, taskId, amount) {
  try {
    // Validate payment method exists
    const stripeCustomerId = await getStripeCustomerId(userId);

    if (!stripeCustomerId) {
      return {
        success: false,
        error: 'No payment method on file',
      };
    }

    const paymentMethod = await stripeService.getDefaultPaymentMethod(stripeCustomerId);

    if (!paymentMethod) {
      return {
        success: false,
        error: 'No payment method on file',
      };
    }

    // Convert dollars to cents
    const amountInCents = Math.round(amount * 100);

    // Create pending transaction record
    const transaction = await createTransaction({
      userId,
      taskId,
      stripePaymentIntentId: null, // Will be updated after payment intent creation
      amount: amountInCents,
      status: 'pending',
    });

    try {
      // Create and confirm payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        amountInCents,
        stripeCustomerId,
        { userId, taskId, transactionId: transaction.transactionId }
      );

      // Update transaction with payment intent ID
      await dynamoDB.send(new UpdateCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { transactionId: transaction.transactionId },
        UpdateExpression: 'SET stripePaymentIntentId = :pid',
        ExpressionAttributeValues: {
          ':pid': paymentIntent.id,
        },
      }));

      // Check payment intent status
      if (paymentIntent.status === 'succeeded') {
        await updateTransactionStatus(transaction.transactionId, 'succeeded');
        return {
          success: true,
          transaction: {
            ...transaction,
            status: 'succeeded',
            stripePaymentIntentId: paymentIntent.id,
          },
        };
      } else if (paymentIntent.status === 'requires_payment_method') {
        const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await updateTransactionStatus(transaction.transactionId, 'failed', { failureReason });
        return {
          success: false,
          transaction: {
            ...transaction,
            status: 'failed',
            failureReason,
          },
          error: failureReason,
        };
      } else {
        // Payment is processing
        return {
          success: true,
          transaction: {
            ...transaction,
            status: 'pending',
            stripePaymentIntentId: paymentIntent.id,
          },
        };
      }
    } catch (paymentError) {
      // Update transaction as failed
      const failureReason = paymentError.message || 'Payment processing failed';
      await updateTransactionStatus(transaction.transactionId, 'failed', { failureReason });

      return {
        success: false,
        transaction: {
          ...transaction,
          status: 'failed',
          failureReason,
        },
        error: failureReason,
      };
    }
  } catch (error) {
    console.error('Error charging failed task:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment',
    };
  }
}

module.exports = {
  getUserPaymentMethod,
  addPaymentMethod,
  removePaymentMethod,
  hasPaymentMethod,
  createTransaction,
  updateTransactionStatus,
  getTransactionsByUserId,
  getTransactionById,
  getTransactionByPaymentIntentId,
  chargeFailedTask,
};
