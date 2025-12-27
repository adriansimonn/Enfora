const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");
const { generateTaskInstances } = require("../utils/recurrenceHelper");

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

    const writeRequests = batch.map(instance => ({
      PutRequest: {
        Item: {
          ...instance,
          taskId: uuidv4(), // Generate unique ID for each instance
          status: "pending",
        }
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
  return { success: true };
};