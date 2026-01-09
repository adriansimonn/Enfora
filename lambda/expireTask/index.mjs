import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  console.log('=== LAMBDA: TASK EXPIRATION HANDLER ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Event:', JSON.stringify(event, null, 2));

  const { userId, taskId } = event;

  // Guard against malformed events
  if (!userId || !taskId) {
    console.error('✗ Missing userId or taskId in event');
    console.error('  userId present:', !!userId);
    console.error('  taskId present:', !!taskId);
    return;
  }

  console.log(`Processing task expiration for userId: ${userId}, taskId: ${taskId}`);

  // Fetch the task
  console.log('[Lambda] Fetching task from DynamoDB...');
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
    console.warn(`✗ Task ${taskId} not found in DynamoDB`);
    return;
  }

  console.log('✓ Task found in DynamoDB');
  const currentStatus = getResult.Item.status?.S;
  const stakeAmount = getResult.Item.stakeAmount?.N;
  console.log('  Task status:', currentStatus);
  console.log('  Stake amount:', stakeAmount);
  console.log('  Title:', getResult.Item.title?.S);

  // Only expire pending tasks (or tasks with rejected evidence that can still be resubmitted)
  // PENDING = no evidence submitted yet -> mark as FAILED
  // REJECTED = evidence was rejected, user can resubmit -> mark as FAILED if deadline passed
  // REVIEW = user disputed rejection, waiting for human review -> DO NOT mark as FAILED (human reviewers may not be able to review before deadline)
  if (currentStatus !== "pending" && currentStatus !== "rejected") {
    console.log(`Task ${taskId} status is ${currentStatus}, skipping expiration (not pending/rejected)`);
    return;
  }

  console.log('[Lambda] Task is eligible for expiration, updating status to failed...');

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
    console.log(`✓ Task ${taskId} marked as failed`);

    // Check if task has stake amount and trigger payment
    const stakeAmount = getResult.Item.stakeAmount?.N;
    console.log('[Lambda] Checking for stake amount...');
    console.log('  Stake amount:', stakeAmount);
    console.log('  Has stake:', !!(stakeAmount && parseFloat(stakeAmount) > 0));

    if (stakeAmount && parseFloat(stakeAmount) > 0) {
      console.log('[Lambda] Task has stake amount, initiating payment charge...');
      try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const paymentApiKey = process.env.PAYMENT_API_KEY;

        console.log('[Lambda] Payment configuration:');
        console.log('  Backend URL:', backendUrl);
        console.log('  Payment API Key configured:', !!paymentApiKey);
        console.log('  Payment API Key (first 10 chars):', paymentApiKey?.substring(0, 10));

        if (!paymentApiKey) {
          console.error('✗ PAYMENT_API_KEY not configured in Lambda environment variables');
          console.error('  This will prevent payment charges from working');
        } else {
          const chargeUrl = `${backendUrl}/api/payments/charge`;
          const amount = parseFloat(stakeAmount);

          console.log('[Lambda] Making payment charge request...');
          console.log('  URL:', chargeUrl);
          console.log('  Amount:', amount);
          console.log('  User ID:', userId);
          console.log('  Task ID:', taskId);

          const response = await fetch(chargeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': paymentApiKey
            },
            body: JSON.stringify({
              userId,
              taskId,
              amount
            })
          });

          console.log('[Lambda] Payment charge response:');
          console.log('  Status:', response.status);
          console.log('  Status text:', response.statusText);

          if (response.ok) {
            const result = await response.json();
            console.log(`✓ Payment charged successfully for task ${taskId}`);
            console.log('  Response:', JSON.stringify(result, null, 2));
          } else {
            const error = await response.text();
            console.error(`✗ Payment charge failed for task ${taskId}`);
            console.error('  Status code:', response.status);
            console.error('  Error response:', error);
          }
        }
      } catch (paymentError) {
        console.error(`✗ Failed to charge payment for task ${taskId}:`, paymentError);
        console.error('  Error message:', paymentError.message);
        console.error('  Error stack:', paymentError.stack);
        // Don't fail task expiration if payment fails, just log for manual review
      }
    } else {
      console.log('[Lambda] No stake amount, skipping payment charge');
    }
  } catch (err) {
    // ConditionalCheckFailedException = task already updated
    // Safe to ignore
    if (err.name !== "ConditionalCheckFailedException") {
      console.error(`✗ Error updating task ${taskId}:`, err);
      console.error('  Error name:', err.name);
      console.error('  Error message:', err.message);
      throw err;
    }
    console.log(`Task ${taskId} already updated by another process (race condition handled)`);
  }

  console.log('=== LAMBDA EXECUTION COMPLETE ===');
};
