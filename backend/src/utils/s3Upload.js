import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROFILE_PICTURES_BUCKET = "enfora-user-profile-pictures";

/**
 * Upload profile picture to S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - The MIME type (e.g., 'image/jpeg')
 * @param {string} userId - The user ID for naming the file
 * @returns {Promise<string>} - The S3 URL of the uploaded file
 */
export async function uploadProfilePicture(fileBuffer, mimeType, userId) {
  // Generate unique filename
  const fileExtension = mimeType.split("/")[1];
  const fileName = `${userId}-${crypto.randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: PROFILE_PICTURES_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
    // Note: Bucket is configured with a public-read bucket policy instead of ACLs
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${PROFILE_PICTURES_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
}

/**
 * Delete profile picture from S3
 * @param {string} fileUrl - The full S3 URL of the file
 */
export async function deleteProfilePicture(fileUrl) {
  // Extract the file key from the URL
  const urlParts = fileUrl.split("/");
  const fileName = urlParts[urlParts.length - 1];

  const command = new DeleteObjectCommand({
    Bucket: PROFILE_PICTURES_BUCKET,
    Key: fileName,
  });

  await s3Client.send(command);
}
