require("dotenv").config();
const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

console.log("\n=== ENVIRONMENT VARIABLES ===");
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "SET (length: " + process.env.AWS_ACCESS_KEY_ID.length + ")" : "NOT SET");
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "SET (length: " + process.env.AWS_SECRET_ACCESS_KEY.length + ")" : "NOT SET");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDB = DynamoDBDocumentClient.from(client);

async function testConnection() {
  try {
    console.log("\n=== TESTING CONNECTION ===");
    const listCommand = new ListTablesCommand({});
    const tables = await client.send(listCommand);
    console.log("✓ Connection successful!");
    console.log("Available tables:", tables.TableNames);
    
    if (!tables.TableNames.includes("Tasks")) {
      console.log("\n⚠ WARNING: 'Tasks' table not found in this region/account!");
    }
  } catch (error) {
    console.log("✗ Connection failed!");
    console.error("Error:", error.message);
    console.error("Error code:", error.name);
  }
}

async function testPutItem() {
  try {
    console.log("\n=== TESTING PUT ITEM ===");
    const testItem = {
      taskId: "test-" + Date.now(),
      userId: "test-user",
      title: "Test Task",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    const command = new PutCommand({
      TableName: "Tasks",
      Item: testItem,
    });
    
    await dynamoDB.send(command);
    console.log("✓ PutItem successful!");
    console.log("Test item:", testItem);
  } catch (error) {
    console.log("✗ PutItem failed!");
    console.error("Error:", error.message);
    console.error("Error code:", error.name);
    console.error("Error details:", JSON.stringify(error, null, 2));
  }
}

async function runTests() {
  await testConnection();
  await testPutItem();
}

runTests();
