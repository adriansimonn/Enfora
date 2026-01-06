// routes/evidenceRoutes.js
const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = require("../config/dynamoClient");
const { validateEvidence } = require("../services/aiValidator");
const { extractText } = require("../utils/extractText");
const { extractMetadataDates } = require("../utils/extractMetadata");
const { deleteTaskExpirationSchedule } = require("../services/schedulerService");

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

// File filter to only allow specific formats
const fileFilter = (_req, file, cb) => {
  const allowedImageFormats = ['.png', '.jpg', '.jpeg'];
  const allowedDocumentFormats = ['.pdf', '.docx', '.txt', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Check if it's an allowed image or document format
  if (allowedImageFormats.includes(ext) || allowedDocumentFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${ext}. Only PNG, JPEG, JPG, PDF, DOCX, TXT, and MD files are allowed.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB hard limit
    files: 1,
  },
  fileFilter,
});

/**
 * POST /api/evidence/upload
 */
router.post("/upload", (req, res, next) => {
  upload.single("evidence")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { taskId, userId, taskTitle, taskDescription, isExpiredCheck } = req.body;
    const file = req.file;

    if (!taskId || !userId || !taskDescription) {
      return res.status(400).json({
        error: "Missing required fields (taskId, userId, taskDescription)",
      });
    }

    // If this is an expired check request (frontend detected expiry)
    if (isExpiredCheck === 'true') {
      const currentTimestamp = new Date().toISOString();

      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          userId: userId,
          taskId: taskId
        },
        UpdateExpression: "SET #st = :status, failedAt = :failedAt",
        ExpressionAttributeNames: {
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":status": "failed",
          ":failedAt": currentTimestamp,
        },
        ReturnValues: "ALL_NEW",
      };

      await dynamoDB.send(new UpdateCommand(updateParams));

      return res.status(200).json({
        message: "Task marked as failed due to expiration",
        status: "failed",
        isExpired: true,
      });
    }

    if (!file) {
      return res.status(400).json({
        error: "Missing required file",
      });
    }

    /**
     * 1. Fetch task from database to verify deadline
     */
    const getParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        taskId: taskId
      }
    };

    const taskResult = await dynamoDB.send(new GetCommand(getParams));
    const task = taskResult.Item;

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    // Check if task deadline has passed
    const now = new Date().toISOString();
    const deadline = new Date(task.deadline).toISOString();

    if (now > deadline) {
      // Task has expired, update status to failed
      const currentTimestamp = new Date().toISOString();

      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          userId: userId,
          taskId: taskId
        },
        UpdateExpression: "SET #st = :status, failedAt = :failedAt",
        ExpressionAttributeNames: {
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":status": "failed",
          ":failedAt": currentTimestamp,
        },
        ReturnValues: "ALL_NEW",
      };

      await dynamoDB.send(new UpdateCommand(updateParams));

      return res.status(400).json({
        error: "Task deadline has passed. Evidence cannot be submitted.",
        status: "failed",
        isExpired: true,
      });
    }

    /**
     * 2. Extract and validate evidence metadata
     */
    const { creationDate, modificationDate } = await extractMetadataDates(file.buffer, file.originalname);

    if (task.createdAt) {
      const taskCreationDate = new Date(task.createdAt);
      const fileExt = file.originalname.split(".").pop().toLowerCase();
      const isImageFile = ["png", "jpg", "jpeg"].includes(fileExt);
      const isDocxFile = fileExt === "docx";

      // For images: Check creation date (images can't be edited in place)
      if (isImageFile && creationDate && creationDate < taskCreationDate) {
        return res.status(400).json({
          error: "Evidence was created before the task was created. Please submit evidence created after the task.",
          evidenceCreatedAt: creationDate.toISOString(),
          taskCreatedAt: task.createdAt,
        });
      }

      // For DOCX only: Check modification date (documents can be edited after creation)
      // Note: PDF validation disabled - many PDF generators (Google Docs, etc.) update metadata on export
      if (isDocxFile && modificationDate && modificationDate < taskCreationDate) {
        return res.status(400).json({
          error: "Evidence was last modified before the task was created. Please submit evidence created or modified after the task.",
          evidenceModifiedAt: modificationDate.toISOString(),
          taskCreatedAt: task.createdAt,
        });
      }
    }

    /**
     * 3. Upload evidence to S3
     */
    const fileKey = `evidence/${userId}/${uuidv4()}-${file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const evidenceURL = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    /**
     * 4. Extract text for document evidence (if applicable)
     */
    let extractedText = null;
    if (file.originalname.match(/\.(pdf|docx|txt|md)$/i)) {
      extractedText = await extractText(file.buffer, file.originalname);
    }

    /**
     * 5. AI VALIDATION
     */
    const validationResult = await validateEvidence({
      taskTitle,
      taskDescription,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      extractedText,
    });

    /**
     * 6. Map AI decision → task status
     */
    let newStatus = "review";
    const currentTimestamp = new Date().toISOString();
    const updateExpressionParts = [
      "submittedEvidenceURL = :url",
      "#st = :status",
      "validationResult = :validation"
    ];
    const expressionAttributeValues = {
      ":url": evidenceURL,
      ":status": newStatus,
      ":validation": validationResult,
    };

    if (validationResult.decision === "PASS") {
      newStatus = "completed";
      updateExpressionParts.push("completedAt = :completedAt");
      expressionAttributeValues[":completedAt"] = currentTimestamp;
      expressionAttributeValues[":status"] = newStatus;
    } else if (validationResult.decision === "FAIL") {
      newStatus = "rejected";
      updateExpressionParts.push("rejectedAt = :rejectedAt");
      expressionAttributeValues[":rejectedAt"] = currentTimestamp;
      expressionAttributeValues[":status"] = newStatus;
    }

    /**
     * 7. Update DynamoDB task (with composite key: userId + taskId)
     */
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        taskId: taskId
      },
      UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDB.send(new UpdateCommand(updateParams));

    /**
     * 8. Delete EventBridge schedule if task is completed
     * Note: Keep schedule for rejected/review status - user can resubmit evidence
     */
    if (newStatus === "completed") {
      try {
        await deleteTaskExpirationSchedule(userId, taskId);
        console.log(`EventBridge schedule deleted for completed task ${taskId}`);
      } catch (scheduleError) {
        console.error("Failed to delete EventBridge schedule:", scheduleError);
        // Don't fail the response if schedule deletion fails
      }
    }

    /**
     * 9. Response
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