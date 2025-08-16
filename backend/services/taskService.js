const { v4: uuidv4 } = require("uuid");
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

  await dynamoDB.put(params).promise();
  return taskItem;
};

exports.getTasksByUser = async (userId) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "UserIdIndex", // optional: create GSI for userId
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": userId,
    },
  };

  const result = await dynamoDB.query(params).promise();
  return result.Items;
};
