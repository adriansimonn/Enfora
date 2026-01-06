import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamoDB from "../../config/dynamoClient.js";

const VERIFICATION_CODES_TABLE = "VerificationCodes";

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store a verification code for an email
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @param {Object} userData - Additional user data to store temporarily
 */
export async function storeVerificationCode(email, code, userData) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  const item = {
    email: email.toLowerCase(),
    code,
    ...userData,
    expiresAt,
    createdAt: Date.now(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: VERIFICATION_CODES_TABLE,
      Item: item,
    })
  );

  return item;
}

/**
 * Get verification code data by email
 * @param {string} email - User's email address
 */
export async function getVerificationCode(email) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: VERIFICATION_CODES_TABLE,
      Key: { email: email.toLowerCase() },
    })
  );

  return result.Item || null;
}

/**
 * Verify code and check if it's expired
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code to validate
 */
export async function verifyCode(email, code) {
  const item = await getVerificationCode(email);

  if (!item) {
    return { valid: false, reason: "CODE_NOT_FOUND" };
  }

  if (Date.now() > item.expiresAt) {
    // Delete expired code
    await deleteVerificationCode(email);
    return { valid: false, reason: "CODE_EXPIRED" };
  }

  if (item.code !== code) {
    return { valid: false, reason: "CODE_MISMATCH" };
  }

  return { valid: true, userData: item };
}

/**
 * Delete verification code after successful verification or expiry
 * @param {string} email - User's email address
 */
export async function deleteVerificationCode(email) {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: VERIFICATION_CODES_TABLE,
      Key: { email: email.toLowerCase() },
    })
  );
}
