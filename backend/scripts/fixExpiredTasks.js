/**
 * Utility script to find and mark tasks with past deadlines as failed
 * This is useful for fixing tasks created before EventBridge integration
 *
 * Usage: node scripts/fixExpiredTasks.js
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = "Tasks";

async function fixExpiredTasks() {
  console.log("Scanning for expired tasks...\n");

  const now = new Date();
  let fixed = 0;
  let scanned = 0;

  try {
    // Scan all tasks (in production, you'd want to use Query with GSI)
    const scanParams = {
      TableName: TABLE_NAME,
    };

    const result = await dynamoDB.send(new ScanCommand(scanParams));
    const tasks = result.Items || [];
    scanned = tasks.length;

    console.log(`Found ${tasks.length} total tasks\n`);

    for (const task of tasks) {
      // Check if task is pending or rejected and deadline has passed
      // Review tasks are NOT expired (human reviewers may need more time)
      if ((task.status === "pending" || task.status === "rejected") && task.deadline) {
        const deadline = new Date(task.deadline);

        if (deadline <= now) {
          console.log(`Task ${task.taskId} (${task.title}) has expired deadline: ${task.deadline}`);

          // Update task to failed
          const updateParams = {
            TableName: TABLE_NAME,
            Key: {
              userId: task.userId,
              taskId: task.taskId,
            },
            UpdateExpression: "SET #st = :status, failedAt = :failedAt",
            ExpressionAttributeNames: {
              "#st": "status",
            },
            ExpressionAttributeValues: {
              ":status": "failed",
              ":failedAt": now.toISOString(),
            },
          };

          await dynamoDB.send(new UpdateCommand(updateParams));
          console.log(`  ✓ Marked as failed\n`);
          fixed++;
        }
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Total tasks scanned: ${scanned}`);
    console.log(`Expired tasks fixed: ${fixed}`);

  } catch (error) {
    console.error("Error fixing expired tasks:", error);
    process.exit(1);
  }
}

// Run the script
fixExpiredTasks()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
