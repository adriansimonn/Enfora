import crypto from "crypto";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamoDB from "../../config/dynamoClient.js";
import { normalizeEmail } from "../utils/email.js";

const VERIFICATION_CODES_TABLE = "VerificationCodes";

// How many times one stored code may be checked. With a 6-digit code that leaves a guesser
// about 1 chance in 180,000 per code issued.
const MAX_CODE_ATTEMPTS = 5;

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode() {
  // These codes gate accounts, so they come from the crypto generator: Math.random
  // output can be predicted from earlier values.
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Store a verification code for an email. Replaces any code already stored for it and
 * starts the attempt count again.
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @param {Object} userData - Additional user data to store temporarily
 */
export async function storeVerificationCode(email, code, userData) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  const item = {
    email: normalizeEmail(email),
    code,
    ...userData,
    attempts: 0,
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
      Key: { email: normalizeEmail(email) },
      // The attempt count is checked against what this returns, so it must not be stale
      ConsistentRead: true,
    })
  );

  return result.Item || null;
}

/**
 * Add one to a record's attempt count, but only if the record is still the one that was
 * read: same code, same count. Returns false if another request changed it first.
 *
 * This is what makes the count exact. A plain read-then-write would let a burst of
 * parallel guesses all read "no attempts yet". It is a conditional put rather than an
 * update so the table needs no permission beyond the get, put and delete it already uses.
 */
async function countAttempt(item, attempts) {
  try {
    await dynamoDB.send(
      new PutCommand({
        TableName: VERIFICATION_CODES_TABLE,
        Item: { ...item, attempts: attempts + 1 },
        ConditionExpression:
          "#code = :code AND #createdAt = :createdAt AND (#attempts = :attempts OR attribute_not_exists(#attempts))",
        ExpressionAttributeNames: {
          "#code": "code",
          "#createdAt": "createdAt",
          "#attempts": "attempts",
        },
        ExpressionAttributeValues: {
          ":code": item.code,
          ":createdAt": item.createdAt,
          ":attempts": attempts,
        },
      })
    );
    return true;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return false;
    }
    throw error;
  }
}

/**
 * Check a code. Every check is counted against the record before the comparison, and
 * after MAX_CODE_ATTEMPTS checks the code is dead whatever is submitted, until a new one
 * is stored.
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code to validate
 * @param {string} [purpose] - What the code must have been issued for. Leave out for a
 *   sign-up code: those are the only records stored without a purpose.
 */
export async function verifyCode(email, code, purpose) {
  // Each pass either counts this attempt or finds that another request changed the record
  // first, and reads it again. Losing to other attempts can happen MAX_CODE_ATTEMPTS
  // times at most, after which the read below sees the record at its limit.
  for (let pass = 0; pass <= MAX_CODE_ATTEMPTS; pass++) {
    const item = await getVerificationCode(email);

    // A code issued for something else is treated as absent: it is not counted against,
    // and the caller learns nothing about it.
    if (!item || item.purpose !== purpose) {
      return { valid: false, reason: "CODE_NOT_FOUND" };
    }

    if (Date.now() > item.expiresAt) {
      // Delete expired code
      await deleteVerificationCode(email);
      return { valid: false, reason: "CODE_EXPIRED" };
    }

    const attempts = item.attempts || 0;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      return { valid: false, reason: "TOO_MANY_ATTEMPTS" };
    }

    if (!(await countAttempt(item, attempts))) {
      continue;
    }

    if (item.code !== code) {
      return { valid: false, reason: "CODE_MISMATCH" };
    }

    return { valid: true, userData: item };
  }

  return { valid: false, reason: "TOO_MANY_ATTEMPTS" };
}

/**
 * Delete verification code after successful verification or expiry
 * @param {string} email - User's email address
 */
export async function deleteVerificationCode(email) {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: VERIFICATION_CODES_TABLE,
      Key: { email: normalizeEmail(email) },
    })
  );
}
