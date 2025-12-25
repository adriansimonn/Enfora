const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

console.log("DynamoDB Client Credentials Check:", {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "Exists" : "Missing",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "Exists" : "Missing",
});

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: `https://dynamodb.${process.env.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  // Force the SDK to ONLY use these credentials (no env provider chain)
  credentialDefaultProvider: () => async () => ({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }),
});

console.log("Client config:", client.config);

const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

module.exports = dynamoDB;
