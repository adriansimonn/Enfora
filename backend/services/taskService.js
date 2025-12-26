const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");

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
    console.log("Attempting DynamoDB PUT:", JSON.stringify(params, null, 2));
    await dynamoDB.send(new PutCommand(params));
    console.log("DynamoDB PUT succeeded");
    return taskItem;
  } catch (error) {
    console.error("DynamoDB Error:", error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
};

exports.getTasksByUser = async (userId) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const result = await dynamoDB.send(new QueryCommand(params));
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