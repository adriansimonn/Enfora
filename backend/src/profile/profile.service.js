import * as profilesRepo from "../db/profiles.repo.js";
import * as usersRepo from "../db/users.repo.js";
import { uploadProfilePicture, deleteProfilePicture } from "../utils/s3Upload.js";

/**
 * Create a new user profile
 */
export async function createProfile({ userId, username, displayName }) {
  // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(username)) {
    throw new Error("INVALID_USERNAME_FORMAT");
  }

  // Check if username is available
  const isAvailable = await profilesRepo.isUsernameAvailable(username);
  if (!isAvailable) {
    throw new Error("USERNAME_TAKEN");
  }

  // Verify user exists
  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Create profile
  const profile = await profilesRepo.createProfile({
    username: username.toLowerCase(),
    userId,
    displayName: displayName || username,
    bio: "",
  });

  return profile;
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username) {
  const profile = await profilesRepo.findProfileByUsername(username);
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }
  return profile;
}

/**
 * Get profile by userId
 */
export async function getProfileByUserId(userId) {
  const profile = await profilesRepo.findProfileByUserId(userId);
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }
  return profile;
}

/**
 * Update profile information
 */
export async function updateProfileInfo(username, userId, updates) {
  // Verify the user owns this profile
  const profile = await profilesRepo.findProfileByUsername(username);
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (profile.userId !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // Validate bio length if provided
  if (updates.bio !== undefined && updates.bio.length > 250) {
    throw new Error("BIO_TOO_LONG");
  }

  // Handle username change separately if needed
  if (updates.username && updates.username !== username) {
    return await changeUsername(username, updates.username, userId);
  }

  // Update other fields
  const allowedUpdates = {};
  if (updates.displayName !== undefined) allowedUpdates.displayName = updates.displayName;
  if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;

  const updatedProfile = await profilesRepo.updateProfile(username, allowedUpdates);
  return updatedProfile;
}

/**
 * Change username
 */
export async function changeUsername(oldUsername, newUsername, userId) {
  // Validate new username format
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(newUsername)) {
    throw new Error("INVALID_USERNAME_FORMAT");
  }

  // Verify ownership
  const profile = await profilesRepo.findProfileByUsername(oldUsername);
  if (!profile || profile.userId !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // Check if new username is available
  const isAvailable = await profilesRepo.isUsernameAvailable(newUsername);
  if (!isAvailable) {
    throw new Error("USERNAME_TAKEN");
  }

  // Update username
  const updatedProfile = await profilesRepo.updateUsername(oldUsername, newUsername, userId);
  return updatedProfile;
}

/**
 * Upload and update profile picture
 */
export async function updateProfilePictureService(username, userId, fileBuffer, mimeType) {
  // Verify the user owns this profile
  const profile = await profilesRepo.findProfileByUsername(username);
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (profile.userId !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error("INVALID_FILE_TYPE");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (fileBuffer.length > maxSize) {
    throw new Error("FILE_TOO_LARGE");
  }

  // Delete old profile picture if exists
  if (profile.profilePictureUrl) {
    try {
      await deleteProfilePicture(profile.profilePictureUrl);
    } catch (error) {
      console.error("Failed to delete old profile picture:", error);
      // Continue anyway - we don't want to fail the upload
    }
  }

  // Upload new picture
  const profilePictureUrl = await uploadProfilePicture(fileBuffer, mimeType, userId);

  // Update profile
  const updatedProfile = await profilesRepo.updateProfilePicture(username, profilePictureUrl);
  return updatedProfile;
}

/**
 * Remove profile picture
 */
export async function removeProfilePictureService(username, userId) {
  // Verify the user owns this profile
  const profile = await profilesRepo.findProfileByUsername(username);
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (profile.userId !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  // Delete from S3 if exists
  if (profile.profilePictureUrl) {
    try {
      await deleteProfilePicture(profile.profilePictureUrl);
    } catch (error) {
      console.error("Failed to delete profile picture from S3:", error);
      // Continue anyway
    }
  }

  // Remove from profile
  const updatedProfile = await profilesRepo.removeProfilePicture(username);
  return updatedProfile;
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username) {
  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return { available: false, reason: "INVALID_FORMAT" };
  }

  const isAvailable = await profilesRepo.isUsernameAvailable(username);
  return { available: isAvailable, reason: isAvailable ? null : "USERNAME_TAKEN" };
}
