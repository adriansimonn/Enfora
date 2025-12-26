// routes/evidenceRoutes.js
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = require("../config/dynamoClient");
const { validateEvidence } = require("../services/aiValidator");
const { extractText } = require("../utils/extractText");

const router = express.Router();
const TABLE_NAME = "Tasks";

/**
 * AWS S3 SETUP
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * MULTER SETUP (single file only)
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB hard limit
    files: 1,
  },
});

/**
 * POST /api/evidence/upload
 */
router.post("/upload", upload.single("evidence"), async (req, res) => {
  try {
    const { taskId, userId, taskTitle, taskDescription } = req.body;
    const file = req.file;

    if (!taskId || !userId || !taskDescription || !file) {
      return res.status(400).json({
        error: "Missing required fields (taskId, userId, taskDescription, or file)",
      });
    }

    /**
     * 1. Upload evidence to S3
     */
    const fileKey = `evidence/${userId}/${uuidv4()}-${file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const evidenceURL = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    /**
     * 2. Extract text for document evidence (if applicable)
     */
    let extractedText = null;
    if (file.originalname.match(/\.(pdf|docx|txt|md)$/i)) {
      extractedText = await extractText(file.buffer, file.originalname);
    }

    /**
     * 3. AI VALIDATION
     */
    const validationResult = await validateEvidence({
      taskTitle,
      taskDescription,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      extractedText,
    });

    /**
     * 4. Map AI decision → task status
     */
    let newStatus = "review";
    if (validationResult.decision === "PASS") {
      newStatus = "completed";
    } else if (validationResult.decision === "FAIL") {
      newStatus = "failed";
    }

    /**
     * 5. Update DynamoDB task (with composite key: userId + taskId)
     */
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        taskId: taskId
      },
      UpdateExpression: `
        SET submittedEvidenceURL = :url,
            #st = :status,
            validationResult = :validation
      `,
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":url": evidenceURL,
        ":status": newStatus,
        ":validation": validationResult,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDB.send(new UpdateCommand(updateParams));

    /**
     * 6. Response
     */
    return res.status(200).json({
      message: "Evidence uploaded and validated",
      evidenceURL,
      status: newStatus,
      validation: validationResult,
      updatedAttributes: result.Attributes,
    });
  } catch (error) {
    console.error("[Evidence Upload Error]", error);

    return res.status(500).json({
      error: "Failed to upload and validate evidence",
    });
  }
});

module.exports = router;