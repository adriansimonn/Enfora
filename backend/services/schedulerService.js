const { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } = require("@aws-sdk/client-scheduler");
const crypto = require("crypto");
require("dotenv").config();

const schedulerClient = new SchedulerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const LAMBDA_ARN = process.env.EXPIRE_TASK_LAMBDA_ARN;
const ROLE_ARN = process.env.EVENTBRIDGE_ROLE_ARN || "arn:aws:iam::YOUR_ACCOUNT_ID:role/eventbridge-expireTask-role";
const SCHEDULE_GROUP = process.env.SCHEDULE_GROUP || "task-expiration-schedules";

/**
 * Generate a schedule name that's guaranteed to be ≤64 characters
 * Format: task-{hash} where hash is a sha256 hash of userId-taskId (truncated to 56 chars)
 */
function generateScheduleName(userId, taskId) {
  const combined = `${userId}-${taskId}`;
  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  // EventBridge schedule name max length is 64 chars
  // Use "task-" prefix (5 chars) + 56 chars of hash = 61 chars total
  return `task-${hash.substring(0, 56)}`;
}

/**
 * Create a one-time schedule to expire a task at its deadline
 * @param {string} userId - The user ID
 * @param {string} taskId - The task ID
 * @param {string} deadline - ISO 8601 datetime string
 */
exports.createTaskExpirationSchedule = async (userId, taskId, deadline) => {
  try {
    const scheduleName = generateScheduleName(userId, taskId);
    const scheduleTime = new Date(deadline);
    const now = new Date();

    // Check if deadline is in the past
    if (scheduleTime <= now) {
      const error = new Error("DEADLINE_PASSED");
      error.isPastDeadline = true;
      throw error;
    }

    // Format: at(yyyy-MM-ddTHH:mm:ss)
    const scheduleExpression = `at(${scheduleTime.toISOString().slice(0, 19)})`;

    const input = {
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP,
      ScheduleExpression: scheduleExpression,
      ScheduleExpressionTimezone: "UTC",
      FlexibleTimeWindow: {
        Mode: "OFF", // Execute at exact time
      },
      Target: {
        Arn: LAMBDA_ARN,
        RoleArn: ROLE_ARN,
        Input: JSON.stringify({
          userId,
          taskId,
        }),
      },
      State: "ENABLED",
    };

    const command = new CreateScheduleCommand(input);
    const response = await schedulerClient.send(command);
    return response;
  } catch (error) {
    console.error("Error creating EventBridge schedule:", error);
    throw error;
  }
};

/**
 * Delete a task expiration schedule
 * @param {string} userId - The user ID
 * @param {string} taskId - The task ID
 */
exports.deleteTaskExpirationSchedule = async (userId, taskId) => {
  try {
    const scheduleName = generateScheduleName(userId, taskId);

    const input = {
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP,
    };

    const command = new DeleteScheduleCommand(input);
    await schedulerClient.send(command);
  } catch (error) {
    // If schedule doesn't exist, don't throw
    if (error.name === "ResourceNotFoundException") {
      return;
    }

    console.error("Error deleting EventBridge schedule:", error);
    throw error;
  }
};
