import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  QueryCommand,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

const ANALYTICS_TABLE = "UserAnalytics";
const PROFILES_TABLE = "UserProfiles";
const LEADERBOARD_TABLE = "LeaderboardCache";

/**
 * Lambda handler - refreshes leaderboard cache
 * Triggered by EventBridge on a schedule (every 10 minutes)
 */
export const handler = async (event) => {
  console.log("Starting leaderboard refresh...");
  const startTime = Date.now();

  try {
    // Step 1: Scan UserAnalytics for all users with scores > 0
    const allUsers = await scanAllUsersWithScores();
    console.log(`Found ${allUsers.length} users with reliability scores`);

    if (allUsers.length === 0) {
      console.log("No users with scores, skipping leaderboard update");
      return { success: true, message: "No users to rank" };
    }

    // Step 2: Sort and rank users
    const rankedUsers = sortAndRankUsers(allUsers);
    console.log("Users sorted and ranked");

    // Step 3: Enrich top 100 with profile data
    const top100 = rankedUsers.slice(0, 100);
    const top100WithProfiles = await enrichWithProfiles(top100);
    console.log(`Enriched ${top100WithProfiles.length} users with profile data`);

    // Step 4: Cache top 100 in single item
    const timestamp = new Date().toISOString();
    await cacheTop100(top100WithProfiles, allUsers.length, timestamp);
    console.log("Top 100 cached successfully");

    // Step 5: Cache individual user ranks (ranks 101-500)
    const usersToCache = rankedUsers.slice(100, 500);
    const cachedCount = await cacheIndividualRanks(usersToCache, allUsers.length, timestamp);
    console.log(`Cached ${cachedCount} individual user ranks`);

    const duration = Date.now() - startTime;
    console.log(`Leaderboard refresh completed in ${duration}ms`);

    return {
      success: true,
      totalUsers: allUsers.length,
      top100Count: top100WithProfiles.length,
      cachedIndividualRanks: cachedCount,
      duration,
      timestamp
    };
  } catch (error) {
    console.error("Error refreshing leaderboard:", error);
    throw error;
  }
};

/**
 * Scan all users with reliability scores > 0
 */
async function scanAllUsersWithScores() {
  const users = [];
  let lastEvaluatedKey = undefined;

  do {
    const params = {
      TableName: ANALYTICS_TABLE,
      FilterExpression: "reliabilityScore > :zero",
      ExpressionAttributeValues: marshall({ ":zero": 0 }),
      ProjectionExpression: "userId, reliabilityScore"
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await client.send(new ScanCommand(params));

    if (result.Items) {
      users.push(...result.Items.map(item => unmarshall(item)));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return users;
}

/**
 * Sort users by score and assign ranks
 */
function sortAndRankUsers(users) {
  // Sort by reliabilityScore (desc), then userId (asc) for tie-breaking
  users.sort((a, b) => {
    if (b.reliabilityScore !== a.reliabilityScore) {
      return b.reliabilityScore - a.reliabilityScore;
    }
    return a.userId.localeCompare(b.userId);
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  let previousScore = null;

  return users.map((user, index) => {
    if (previousScore !== null && user.reliabilityScore !== previousScore) {
      currentRank = index + 1;
    }
    previousScore = user.reliabilityScore;

    return {
      ...user,
      rank: currentRank
    };
  });
}

/**
 * Enrich users with profile data
 */
async function enrichWithProfiles(users) {
  const enriched = [];

  for (const user of users) {
    try {
      const result = await client.send(new QueryCommand({
        TableName: PROFILES_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: marshall({ ":userId": user.userId }),
        Limit: 1
      }));

      const profile = result.Items?.[0] ? unmarshall(result.Items[0]) : null;

      enriched.push({
        rank: user.rank,
        userId: user.userId,
        username: profile?.username || "unknown",
        displayName: profile?.displayName || profile?.username || "Unknown User",
        profilePictureUrl: profile?.profilePictureUrl || null,
        reliabilityScore: user.reliabilityScore,
        tags: profile?.tags || []
      });
    } catch (error) {
      console.error(`Error fetching profile for ${user.userId}:`, error);
      enriched.push({
        rank: user.rank,
        userId: user.userId,
        username: "unknown",
        displayName: "Unknown User",
        profilePictureUrl: null,
        reliabilityScore: user.reliabilityScore,
        tags: []
      });
    }
  }

  return enriched;
}

/**
 * Cache top 100 in single item
 */
async function cacheTop100(rankings, totalUsers, timestamp) {
  const item = {
    cacheType: "GLOBAL_TOP_100",
    lastUpdated: timestamp,
    rankings: rankings,
    totalUsers: totalUsers,
    version: Date.now()
  };

  await client.send(new PutItemCommand({
    TableName: LEADERBOARD_TABLE,
    Item: marshall(item)
  }));
}

/**
 * Cache individual user ranks using batch operations
 */
async function cacheIndividualRanks(users, totalUsers, timestamp) {
  const usersWithProfiles = await enrichWithProfiles(users);
  let count = 0;
  const batchSize = 25; // DynamoDB limit

  for (let i = 0; i < usersWithProfiles.length; i += batchSize) {
    const batch = usersWithProfiles.slice(i, i + batchSize);

    const writeRequests = batch.map(user => ({
      PutRequest: {
        Item: marshall({
          cacheType: `USER_RANK#${user.userId}`,
          lastUpdated: timestamp,
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          profilePictureUrl: user.profilePictureUrl || null,
          reliabilityScore: user.reliabilityScore,
          tags: user.tags || [],
          rank: user.rank,
          totalUsers: totalUsers
        })
      }
    }));

    try {
      await client.send(new BatchWriteItemCommand({
        RequestItems: {
          [LEADERBOARD_TABLE]: writeRequests
        }
      }));

      count += batch.length;
    } catch (error) {
      console.error(`Error batch writing ranks:`, error);
    }
  }

  return count;
}
