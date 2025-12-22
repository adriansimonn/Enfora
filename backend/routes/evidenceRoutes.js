// routes/evidenceRoutes.js
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const dynamoDB = require("../config/dynamoClient");

const router = express.Router();
const TABLE_NAME = "EnforaTasks";

// ----- AWS S3 Setup -----
console.log("AWS REGION:", process.env.AWS_REGION);
console.log("AWS KEY:", process.env.AWS_ACCESS_KEY_ID ? "Exists" : "Missing");
console.log("AWS SECRET:", process.env.AWS_SECRET_ACCESS_KEY ? "Exists" : "Missing");
console.log("BUCKET:", process.env.S3_BUCKET_NAME);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// ----- Multer Setup -----
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----- Mock AI Validator -----
async function mockValidateEvidence(fileBuffer, fileName) {
  // Simple mock — randomly approve/reject for now
  const isValid = Math.random() > 0.2; // 80% chance of success
  console.log(
    `Mock validation result for ${fileName}: ${isValid ? "valid" : "invalid"}`
  );
  return isValid;
}

// ----- Upload Route -----
router.post("/upload", upload.single("evidence"), async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    if (!taskId || !userId || !req.file) {
      return res
        .status(400)
        .json({ error: "Missing required fields (taskId, userId, or file)" });
    }

    // Upload to S3
    const fileKey = `evidence/${userId}/${uuidv4()}-${req.file.originalname}`;
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    const evidenceURL = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Validate evidence (mocked)
    const isValid = await mockValidateEvidence(
      req.file.buffer,
      req.file.originalname
    );

    // Update task in DynamoDB
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { taskId },
      UpdateExpression: "set submittedEvidenceURL = :url, #st = :status",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":url": evidenceURL,
        ":status": isValid ? "completed" : "failed",
      },
      ReturnValues: "UPDATED_NEW",
    };

    await dynamoDB.update(updateParams).promise();

    res.json({
      message: "Evidence uploaded successfully",
      validation: isValid ? "Evidence accepted" : "Evidence rejected",
      evidenceURL,
    });
  } catch (error) {
    console.error("Error uploading evidence:", error);
    res.status(500).json({ error: "Failed to upload evidence" });
  }
});

module.exports = router;
