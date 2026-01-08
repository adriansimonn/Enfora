import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
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

/**
 * Update user's password
 */
export async function updatePassword(userId, newPasswordHash) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET passwordHash = :hash",
      ExpressionAttributeValues: {
        ":hash": newPasswordHash,
      },
    })
  );
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(userId, settings) {
  const updateExpression = [];
  const attributeValues = {};

  if (settings.emailNotifications !== undefined) {
    updateExpression.push("emailNotifications = :emailNotif");
    attributeValues[":emailNotif"] = settings.emailNotifications;
  }
  if (settings.taskReminders !== undefined) {
    updateExpression.push("taskReminders = :taskRem");
    attributeValues[":taskRem"] = settings.taskReminders;
  }
  if (settings.achievementAlerts !== undefined) {
    updateExpression.push("achievementAlerts = :achAlerts");
    attributeValues[":achAlerts"] = settings.achievementAlerts;
  }

  if (updateExpression.length === 0) {
    return;
  }

  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: attributeValues,
    })
  );
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(userId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "emailNotifications, taskReminders, achievementAlerts",
    })
  );

  return {
    emailNotifications: result.Item?.emailNotifications ?? true,
    taskReminders: result.Item?.taskReminders ?? true,
    achievementAlerts: result.Item?.achievementAlerts ?? true,
  };
}

/**
 * Delete user account
 */
export async function deleteUser(userId) {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  );
}

/**
 * Update 2FA settings for a user
 */
export async function update2FASettings(userId, twoFactorData) {
  const updateExpression = [];
  const attributeValues = {};
  const attributeNames = {};

  if (twoFactorData.twoFactorEnabled !== undefined) {
    updateExpression.push("#twoFactorEnabled = :enabled");
    attributeNames["#twoFactorEnabled"] = "twoFactorEnabled";
    attributeValues[":enabled"] = twoFactorData.twoFactorEnabled;
  }

  if (twoFactorData.twoFactorMethod !== undefined) {
    updateExpression.push("twoFactorMethod = :method");
    attributeValues[":method"] = twoFactorData.twoFactorMethod;
  }

  if (twoFactorData.twoFactorSecret !== undefined) {
    updateExpression.push("twoFactorSecret = :secret");
    attributeValues[":secret"] = twoFactorData.twoFactorSecret;
  }

  if (twoFactorData.twoFactorBackupCodes !== undefined) {
    updateExpression.push("twoFactorBackupCodes = :backupCodes");
    attributeValues[":backupCodes"] = twoFactorData.twoFactorBackupCodes;
  }

  if (updateExpression.length === 0) {
    return;
  }

  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
      ExpressionAttributeValues: attributeValues,
    })
  );
}

/**
 * Get 2FA settings for a user
 */
export async function get2FASettings(userId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "twoFactorEnabled, twoFactorMethod, twoFactorSecret, twoFactorBackupCodes",
    })
  );

  return {
    twoFactorEnabled: result.Item?.twoFactorEnabled ?? false,
    twoFactorMethod: result.Item?.twoFactorMethod ?? null,
    twoFactorSecret: result.Item?.twoFactorSecret ?? null,
    twoFactorBackupCodes: result.Item?.twoFactorBackupCodes ?? [],
  };
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET twoFactorEnabled = :disabled REMOVE twoFactorMethod, twoFactorSecret, twoFactorBackupCodes",
      ExpressionAttributeValues: {
        ":disabled": false,
      },
    })
  );
}

/**
 * Use a backup code (remove it from the list)
 */
export async function useBackupCode(userId, codeToRemove) {
  const user = await findUserById(userId);
  if (!user || !user.twoFactorBackupCodes) {
    return false;
  }

  const updatedCodes = user.twoFactorBackupCodes.filter(code => code !== codeToRemove);

  await dynamoDB.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET twoFactorBackupCodes = :codes",
      ExpressionAttributeValues: {
        ":codes": updatedCodes,
      },
    })
  );

  return true;
}