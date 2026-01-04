import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  const { userId, taskId } = event;

  // Guard against malformed events
  if (!userId || !taskId) {
    console.log("Missing userId or taskId in event");
    return;
  }

  console.log(`Processing task expiration for userId: ${userId}, taskId: ${taskId}`);

  // Fetch the task
  const getResult = await client.send(
    new GetItemCommand({
      TableName: "Tasks",
      Key: {
        userId: { S: userId },
        taskId: { S: taskId }
      }
    })
  );

  // Task does not exist
  if (!getResult.Item) {
    console.log(`Task ${taskId} not found`);
    return;
  }

  const currentStatus = getResult.Item.status?.S;
  console.log(`Task ${taskId} current status: ${currentStatus}`);

  // Only expire pending tasks (or tasks with rejected evidence that can still be resubmitted)
  // PENDING = no evidence submitted yet -> mark as FAILED
  // REJECTED = evidence was rejected, user can resubmit -> mark as FAILED if deadline passed
  // REVIEW = user disputed rejection, waiting for human review -> DO NOT mark as FAILED (human reviewers may not be able to review before deadline)
  if (currentStatus !== "pending" && currentStatus !== "rejected") {
    console.log(`Task ${taskId} status is ${currentStatus}, not expiring`);
    return;
  }

  // Atomically update status to failed (idempotent)
  try {
    await client.send(
      new UpdateItemCommand({
        TableName: "Tasks",
        Key: {
          userId: { S: userId },
          taskId: { S: taskId }
        },
        UpdateExpression: "SET #status = :failed, failedAt = :failedAt",
        ConditionExpression: "#status IN (:pending, :rejected)",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":pending": { S: "pending" },
          ":rejected": { S: "rejected" },
          ":failed": { S: "failed" },
          ":failedAt": { S: new Date().toISOString() }
        }
      })
    );
    console.log(`Task ${taskId} marked as failed`);

    // Check if task has stake amount and trigger payment
    if (getResult.Item.stakeAmount?.N && parseFloat(getResult.Item.stakeAmount.N) > 0) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const paymentApiKey = process.env.PAYMENT_API_KEY;

        if (!paymentApiKey) {
          console.error('PAYMENT_API_KEY not configured, skipping payment charge');
        } else {
          const response = await fetch(`${backendUrl}/api/payments/charge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': paymentApiKey
            },
            body: JSON.stringify({
              userId,
              taskId,
              amount: parseFloat(getResult.Item.stakeAmount.N)
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`Payment charged for task ${taskId}:`, result);
          } else {
            const error = await response.text();
            console.error(`Payment charge failed for task ${taskId}:`, error);
          }
        }
      } catch (paymentError) {
        console.error(`Failed to charge payment for task ${taskId}:`, paymentError);
        // Don't fail task expiration if payment fails, just log for manual review
      }
    }
  } catch (err) {
    // ConditionalCheckFailedException = task already updated
    // Safe to ignore
    if (err.name !== "ConditionalCheckFailedException") {
      console.error(`Error updating task ${taskId}:`, err);
      throw err;
    }
    console.log(`Task ${taskId} already updated by another process`);
  }
};
