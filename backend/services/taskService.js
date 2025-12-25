const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");

const TABLE_NAME = "EnforaTasks";

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
    IndexName: "UserIdIndex",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const result = await dynamoDB.send(new QueryCommand(params));
  return result.Items;
};