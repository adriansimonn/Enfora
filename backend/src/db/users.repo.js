import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamoDB from "../../config/dynamoClient.js";

const USERS_TABLE = "Users";
const EMAIL_INDEX = "email-index";

/**
 * Find user by email (via GSI)
 */
export async function findUserByEmail(email) {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: EMAIL_INDEX,
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email.toLowerCase(),
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] || null;
}

/**
 * Find user by userId (PK)
 */
export async function findUserById(userId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  );

  return result.Item || null;
}

/**
 * Create a new user
 */
export async function createUser(user) {
  const now = new Date().toISOString();

  const item = {
    ...user,
    email: user.email.toLowerCase(),
    createdAt: now,
    tokenVersion: 0,
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return item;
}

/**
 * Store hashed refresh token
 */
export async function updateRefreshToken(userId, tokenHash) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET refreshTokenHash = :hash",
      ExpressionAttributeValues: {
        ":hash": tokenHash,
      },
    })
  );
}

/**
 * Remove refresh token (logout)
 */
export async function clearRefreshToken(userId) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "REMOVE refreshTokenHash",
    })
  );
}

/**
 * Get stored refresh token hash
 */
export async function getRefreshTokenHash(userId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "refreshTokenHash",
    })
  );

  return result.Item?.refreshTokenHash || null;
}

/**
 * Increment tokenVersion (refresh token reuse detection)
 */
export async function incrementTokenVersion(userId) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "ADD tokenVersion :inc",
      ExpressionAttributeValues: {
        ":inc": 1,
      },
      ReturnValues: "UPDATED_NEW",
    })
  );

  return result.Attributes.tokenVersion;
}

/**
 * Link Google account to existing user
 */
export async function linkGoogleAccount(userId, googleId) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET googleId = :gid, provider = :provider",
      ExpressionAttributeValues: {
        ":gid": googleId,
        ":provider": "google",
      },
    })
  );
}

/**
 * Update user's Stripe customer ID
 */
export async function updateStripeCustomerId(userId, stripeCustomerId) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET stripeCustomerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": stripeCustomerId,
      },
    })
  );
}

/**
 * Get user's Stripe customer ID
 */
export async function getStripeCustomerId(userId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "stripeCustomerId",
    })
  );

  return result.Item?.stripeCustomerId || null;
}