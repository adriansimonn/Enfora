const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");
const { generateTaskInstances } = require("../utils/recurrenceHelper");
const { createTaskExpirationSchedule, deleteTaskExpirationSchedule } = require("./schedulerService");

const TABLE_NAME = "Tasks";

exports.createTask = async (task) => {
  const taskItem = {
    ...task,
    taskId: uuidv4(),
    status: "pending",
  };

  const params = {
    TableName: TABLE_NAME,
    Item: taskItem,
  };

  try {
    console.log("Creating task with data:", JSON.stringify({
      title: taskItem.title,
      isRecurring: taskItem.isRecurring,
      recurrenceRule: taskItem.recurrenceRule
    }, null, 2));
    console.log("Attempting DynamoDB PUT:", JSON.stringify(params, null, 2));
    await dynamoDB.send(new PutCommand(params));
    console.log("DynamoDB PUT succeeded");

    // If this is a recurring task, generate instances
    if (task.isRecurring && task.recurrenceRule) {
      await createRecurringTaskInstances(taskItem);
    }

    // Create EventBridge schedule for task expiration
    if (taskItem.deadline && taskItem.userId && taskItem.taskId) {
      try {
        await createTaskExpirationSchedule(taskItem.userId, taskItem.taskId, taskItem.deadline);
        console.log(`EventBridge schedule created for task ${taskItem.taskId}`);
      } catch (scheduleError) {
        // If deadline is in the past, immediately mark task as failed
        if (scheduleError.isPastDeadline) {
          console.log(`Marking task ${taskItem.taskId} as failed due to past deadline`);
          const updateParams = {
            TableName: TABLE_NAME,
            Key: {
              userId: taskItem.userId,
              taskId: taskItem.taskId,
            },
            UpdateExpression: "SET #st = :status, failedAt = :failedAt",
            ExpressionAttributeNames: {
              "#st": "status",
            },
            ExpressionAttributeValues: {
              ":status": "failed",
              ":failedAt": new Date().toISOString(),
            },
          };
          await dynamoDB.send(new UpdateCommand(updateParams));
          taskItem.status = "failed";
          taskItem.failedAt = new Date().toISOString();
        } else {
          console.error("Failed to create EventBridge schedule:", scheduleError);
          // Don't fail task creation if schedule creation fails for other reasons
        }
      }
    }

    return taskItem;
  } catch (error) {
    console.error("DynamoDB Error:", error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

/**
 * Create task instances for a recurring task
 */
async function createRecurringTaskInstances(parentTask) {
  const instances = generateTaskInstances(parentTask);

  if (instances.length === 0) {
    return;
  }

  // DynamoDB BatchWrite can handle max 25 items at a time
  const batchSize = 25;

  for (let i = 0; i < instances.length; i += batchSize) {
    const batch = instances.slice(i, i + batchSize);

    const instancesWithIds = batch.map(instance => ({
      ...instance,
      taskId: uuidv4(), // Generate unique ID for each instance
      status: "pending",
    }));

    const writeRequests = instancesWithIds.map(instance => ({
      PutRequest: {
        Item: instance
      }
    }));

    const batchParams = {
      RequestItems: {
        [TABLE_NAME]: writeRequests
      }
    };

    try {
      await dynamoDB.send(new BatchWriteCommand(batchParams));
      console.log(`Created batch of ${batch.length} recurring task instances`);

      // Create EventBridge schedules for each instance
      for (const instance of instancesWithIds) {
        if (instance.deadline && instance.userId && instance.taskId) {
          try {
            await createTaskExpirationSchedule(instance.userId, instance.taskId, instance.deadline);
            console.log(`EventBridge schedule created for recurring task instance ${instance.taskId}`);
          } catch (scheduleError) {
            // If deadline is in the past, immediately mark instance as failed
            if (scheduleError.isPastDeadline) {
              console.log(`Marking recurring instance ${instance.taskId} as failed due to past deadline`);
              const updateParams = {
                TableName: TABLE_NAME,
                Key: {
                  userId: instance.userId,
                  taskId: instance.taskId,
                },
                UpdateExpression: "SET #st = :status, failedAt = :failedAt",
                ExpressionAttributeNames: {
                  "#st": "status",
                },
                ExpressionAttributeValues: {
                  ":status": "failed",
                  ":failedAt": new Date().toISOString(),
                },
              };
              await dynamoDB.send(new UpdateCommand(updateParams));
            } else {
              console.error(`Failed to create schedule for instance ${instance.taskId}:`, scheduleError);
              // Continue with other instances even if one fails
            }
          }
        }
      }
    } catch (error) {
      console.error("Error creating recurring task instances:", error);
      // Continue with next batch even if one fails
    }
  }
}

exports.getTasksByUser = async (userId) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const result = await dynamoDB.send(new QueryCommand(params));

  // Log recurrence info for debugging
  if (result.Items && result.Items.length > 0) {
    const recurringTasks = result.Items.filter(t => t.isRecurring);
    if (recurringTasks.length > 0) {
      console.log(`Found ${recurringTasks.length} recurring tasks for user ${userId}`);
      recurringTasks.forEach(t => {
        console.log(`Task "${t.title}": isRecurring=${t.isRecurring}, recurrenceRule=`, t.recurrenceRule);
      });
    }
  }

  return result.Items;
};

exports.updateTask = async (taskId, userId, updates) => {
  // First verify the task belongs to the user
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      taskId: taskId,
    },
  };

  const existing = await dynamoDB.send(new GetCommand(getParams));
  if (!existing.Item) {
    throw new Error("Task not found or unauthorized");
  }

  // Build update expression dynamically
  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((key, index) => {
    if (key !== 'userId' && key !== 'taskId') { // Don't update keys
      updateExpressionParts.push(`#field${index} = :value${index}`);
      expressionAttributeNames[`#field${index}`] = key;
      expressionAttributeValues[`:value${index}`] = updates[key];
    }
  });

  if (updateExpressionParts.length === 0) {
    return existing.Item; // No updates to make
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      taskId: taskId,
    },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDB.send(new UpdateCommand(params));

  // Delete EventBridge schedule if task is completed or failed
  // Note: Keep schedule for rejected/review status - user can resubmit evidence
  if (updates.status === "completed" || updates.status === "failed") {
    try {
      await deleteTaskExpirationSchedule(userId, taskId);
      console.log(`EventBridge schedule deleted for task ${taskId} with status ${updates.status}`);
    } catch (scheduleError) {
      console.error("Failed to delete EventBridge schedule:", scheduleError);
      // Don't fail the update if schedule deletion fails
    }
  }

  return result.Attributes;
};

exports.deleteTask = async (taskId, userId) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      taskId: taskId,
    },
  };

  await dynamoDB.send(new DeleteCommand(params));

  // Delete EventBridge schedule when task is deleted
  try {
    await deleteTaskExpirationSchedule(userId, taskId);
    console.log(`EventBridge schedule deleted for task ${taskId}`);
  } catch (scheduleError) {
    console.error("Failed to delete EventBridge schedule:", scheduleError);
    // Don't fail the deletion if schedule deletion fails
  }

  return { success: true };
};