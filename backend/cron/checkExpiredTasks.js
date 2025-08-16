const dynamoDB = require("../config/dynamoClient");

const TABLE_NAME = "EnforaTasks";

async function checkExpiredTasks() {
  console.log("🕐 Cron: Checking for expired tasks...");

  const now = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    FilterExpression: "#status = :pending AND #deadline < :now",
    ExpressionAttributeNames: {
      "#status": "status",
      "#deadline": "deadline",
    },
    ExpressionAttributeValues: {
      ":pending": "pending",
      ":now": now,
    },
  };

  try {
    const result = await dynamoDB.scan(params).promise();

    const expiredTasks = result.Items || [];

    for (const task of expiredTasks) {
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { taskId: task.taskId },
        UpdateExpression: "set #status = :failed",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":failed": "failed",
        },
      };

      await dynamoDB.update(updateParams).promise();
      console.log(`❌ Marked task as failed: ${task.taskId}`);
    }

    console.log(`✅ Done. ${expiredTasks.length} task(s) marked as failed.`);
  } catch (error) {
    console.error("🔥 Error checking expired tasks:", error);
  }
}

module.exports = checkExpiredTasks;
