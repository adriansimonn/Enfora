import * as profileService from "./profile.service.js";

/**
 * GET /api/profile/:username
 * Get a user's profile by username
 */
export async function getProfile(req, res) {
  try {
    const { username } = req.params;
    const profile = await profileService.getProfileByUsername(username);
    res.json(profile);
  } catch (error) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * GET /api/profile/user/:userId
 * Get a user's profile by userId (internal use)
 */
export async function getProfileByUserId(req, res) {
  try {
    const { userId } = req.params;
    const profile = await profileService.getProfileByUserId(userId);
    res.json(profile);
  } catch (error) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    console.error("Get profile by userId error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * PUT /api/profile/:username
 * Update profile information
 */
export async function updateProfile(req, res) {
  try {
    const { username } = req.params;
    const userId = req.user.userId; // From auth middleware
    const updates = req.body;

    const updatedProfile = await profileService.updateProfileInfo(
      username,
      userId,
      updates
    );

    res.json(updatedProfile);
  } catch (error) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "You can only edit your own profile" });
    }
    if (error.message === "USERNAME_TAKEN") {
      return res.status(409).json({ error: "Username already taken" });
    }
    if (error.message === "INVALID_USERNAME_FORMAT") {
      return res.status(400).json({
        error: "Invalid username format. Use 3-30 characters: letters, numbers, hyphens, underscores only"
      });
    }
    if (error.message === "BIO_TOO_LONG") {
      return res.status(400).json({ error: "Bio must be 250 characters or less" });
    }
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

/**
 * POST /api/profile/:username/picture
 * Upload profile picture
 */
export async function uploadProfilePicture(req, res) {
  try {
    const { username } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const updatedProfile = await profileService.updateProfilePictureService(
      username,
      userId,
      fileBuffer,
      mimeType
    );

    res.json(updatedProfile);
  } catch (error) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "You can only edit your own profile" });
    }
    if (error.message === "INVALID_FILE_TYPE") {
      return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" });
    }
    if (error.message === "FILE_TOO_LARGE") {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
    }
    console.error("Upload profile picture error:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
}

/**
 * DELETE /api/profile/:username/picture
 * Remove profile picture
 */
export async function deleteProfilePicture(req, res) {
  try {
    const { username } = req.params;
    const userId = req.user.userId;

    const updatedProfile = await profileService.removeProfilePictureService(
      username,
      userId
    );

    res.json(updatedProfile);
  } catch (error) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error.message === "UNAUTHORIZED") {
      return res.status(403).json({ error: "You can only edit your own profile" });
    }
    console.error("Delete profile picture error:", error);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
}

/**
 * GET /api/profile/check-username/:username
 * Check if username is available
 */
export async function checkUsername(req, res) {
  try {
    const { username } = req.params;
    const result = await profileService.checkUsernameAvailability(username);
    res.json(result);
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ error: "Failed to check username availability" });
  }
}
