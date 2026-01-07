import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import dynamoDB from "../../config/dynamoClient.js";

const PROFILES_TABLE = "UserProfiles";

/**
 * Create a new user profile
 */
export async function createProfile(profile) {
  const now = new Date().toISOString();

  const item = {
    ...profile,
    username: profile.username.toLowerCase(),
    tags: profile.tags || [], // Initialize empty tags array
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: PROFILES_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(username)",
    })
  );

  return item;
}

/**
 * Find profile by username (PK)
 */
export async function findProfileByUsername(username) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
    })
  );

  return result.Item || null;
}

/**
 * Find profile by userId (using query on GSI)
 */
export async function findProfileByUserId(userId) {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: PROFILES_TABLE,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0] || null;
}

/**
 * Update profile display name
 */
export async function updateDisplayName(username, displayName) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: "SET displayName = :displayName, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":displayName": displayName,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Update profile bio
 */
export async function updateBio(username, bio) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: "SET bio = :bio, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":bio": bio,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Update profile picture URL
 */
export async function updateProfilePicture(username, profilePictureUrl) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: "SET profilePictureUrl = :url, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":url": profilePictureUrl,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture(username) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: "REMOVE profilePictureUrl SET updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Update username (requires updating the partition key)
 */
export async function updateUsername(oldUsername, newUsername, userId) {
  // First, get the current profile
  const currentProfile = await findProfileByUsername(oldUsername);

  if (!currentProfile) {
    throw new Error("Profile not found");
  }

  // Check if new username is available
  const existingProfile = await findProfileByUsername(newUsername);
  if (existingProfile) {
    throw new Error("Username already taken");
  }

  // Create new profile with new username
  const updatedProfile = {
    ...currentProfile,
    username: newUsername.toLowerCase(),
    updatedAt: new Date().toISOString(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: PROFILES_TABLE,
      Item: updatedProfile,
      ConditionExpression: "attribute_not_exists(username)",
    })
  );

  // Delete old profile
  await dynamoDB.send(
    new DeleteCommand({
      TableName: PROFILES_TABLE,
      Key: { username: oldUsername.toLowerCase() },
    })
  );

  return updatedProfile;
}

/**
 * Update multiple profile fields at once
 */
export async function updateProfile(username, updates) {
  const updateExpressions = [];
  const expressionAttributeValues = {
    ":updatedAt": new Date().toISOString(),
  };

  if (updates.displayName !== undefined) {
    updateExpressions.push("displayName = :displayName");
    expressionAttributeValues[":displayName"] = updates.displayName;
  }

  if (updates.bio !== undefined) {
    updateExpressions.push("bio = :bio");
    expressionAttributeValues[":bio"] = updates.bio;
  }

  if (updates.profilePictureUrl !== undefined) {
    updateExpressions.push("profilePictureUrl = :url");
    expressionAttributeValues[":url"] = updates.profilePictureUrl;
  }

  if (updates.tags !== undefined) {
    updateExpressions.push("tags = :tags");
    expressionAttributeValues[":tags"] = updates.tags;
  }

  updateExpressions.push("updatedAt = :updatedAt");

  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Update user tags
 */
export async function updateTags(username, tags) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
      UpdateExpression: "SET tags = :tags, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":tags": tags,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username) {
  const profile = await findProfileByUsername(username);
  return profile === null;
}

/**
 * Delete profile
 */
export async function deleteProfile(username) {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: PROFILES_TABLE,
      Key: { username: username.toLowerCase() },
    })
  );
}
