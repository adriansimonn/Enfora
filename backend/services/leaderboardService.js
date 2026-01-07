const { PutCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");

const LEADERBOARD_TABLE = "LeaderboardCache";
const ANALYTICS_TABLE = "UserAnalytics";
const PROFILES_TABLE = "UserProfiles";

/**
 * Get top 100 users from cache
 */
exports.getTop100 = async () => {
  try {
    // Query for the most recent GLOBAL_TOP_100 cache entry
    const params = {
      TableName: LEADERBOARD_TABLE,
      KeyConditionExpression: "cacheType = :cacheType",
      ExpressionAttributeValues: {
        ":cacheType": "GLOBAL_TOP_100"
      },
      ScanIndexForward: false, // Sort descending by lastUpdated
      Limit: 1 // Get only the most recent entry
    };

    const result = await dynamoDB.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      // Cache not initialized yet
      return {
        rankings: [],
        lastUpdated: null,
        totalUsers: 0
      };
    }

    const cachedData = result.Items[0];

    return {
      rankings: cachedData.rankings || [],
      lastUpdated: cachedData.lastUpdated,
      totalUsers: cachedData.totalUsers || 0
    };
  } catch (error) {
    console.error("Error fetching top 100:", error);
    throw error;
  }
};

/**
 * Get user's rank (from cache or compute)
 * @param {string} userId - User ID to lookup
 */
exports.getUserRank = async (userId) => {
  try {
    // First check if user is in top 100
    const top100 = await exports.getTop100();
    const inTop100 = top100.rankings.find(r => r.userId === userId);

    if (inTop100) {
      return {
        rank: inTop100.rank,
        userId: inTop100.userId,
        username: inTop100.username,
        displayName: inTop100.displayName,
        profilePictureUrl: inTop100.profilePictureUrl,
        reliabilityScore: inTop100.reliabilityScore,
        tags: inTop100.tags || [],
        totalUsers: top100.totalUsers,
        lastUpdated: top100.lastUpdated
      };
    }

    // Check user-specific rank cache
    const userRankParams = {
      TableName: LEADERBOARD_TABLE,
      KeyConditionExpression: "cacheType = :cacheType",
      ExpressionAttributeValues: {
        ":cacheType": `USER_RANK#${userId}`
      },
      ScanIndexForward: false,
      Limit: 1
    };

    const userRankResult = await dynamoDB.send(new QueryCommand(userRankParams));

    if (userRankResult.Items && userRankResult.Items.length > 0) {
      const userRank = userRankResult.Items[0];
      return {
        rank: userRank.rank,
        userId: userRank.userId,
        username: userRank.username,
        displayName: userRank.displayName,
        profilePictureUrl: userRank.profilePictureUrl,
        reliabilityScore: userRank.reliabilityScore,
        tags: userRank.tags || [],
        totalUsers: userRank.totalUsers,
        lastUpdated: userRank.lastUpdated
      };
    }

    // Fallback: compute on-demand (shouldn't happen if Lambda is working)
    console.warn(`User ${userId} rank not found in cache, computing on-demand`);
    return await exports.computeUserRankOnDemand(userId);
  } catch (error) {
    console.error("Error fetching user rank:", error);
    throw error;
  }
};

/**
 * Compute user rank on-demand (fallback if cache miss)
 */
exports.computeUserRankOnDemand = async (userId) => {
  try {
    // Get user's analytics
    const analyticsService = require("./analyticsService");
    const userAnalytics = await analyticsService.getUserAnalytics(userId);

    if (!userAnalytics || userAnalytics.reliabilityScore === 0) {
      return null; // User has no score
    }

    // Scan UserAnalytics to count users with higher scores
    // WARNING: This is expensive - should only happen on cache miss
    const scanParams = {
      TableName: ANALYTICS_TABLE,
      FilterExpression: "reliabilityScore > :userScore",
      ExpressionAttributeValues: {
        ":userScore": userAnalytics.reliabilityScore
      },
      ProjectionExpression: "userId"
    };

    let higherRankedCount = 0;
    let lastEvaluatedKey = undefined;

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const scanResult = await dynamoDB.send(new ScanCommand(scanParams));
      higherRankedCount += scanResult.Items.length;
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const rank = higherRankedCount + 1;

    // Get user profile for display info
    const profileParams = {
      TableName: PROFILES_TABLE,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      Limit: 1
    };

    const profileResult = await dynamoDB.send(new QueryCommand(profileParams));
    const profile = profileResult.Items?.[0];

    return {
      rank,
      userId,
      username: profile?.username || "unknown",
      displayName: profile?.displayName || profile?.username || "Unknown User",
      profilePictureUrl: profile?.profilePictureUrl,
      reliabilityScore: userAnalytics.reliabilityScore,
      tags: profile?.tags || [],
      totalUsers: null, // Unknown without full scan
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error computing user rank on-demand:", error);
    throw error;
  }
};

/**
 * Calculate full leaderboard (called by Lambda)
 * This is the core ranking algorithm
 */
exports.calculateLeaderboard = async () => {
  try {
    console.log("Starting leaderboard calculation...");

    // Step 1: Scan UserAnalytics for all users with reliabilityScore > 0
    const scanParams = {
      TableName: ANALYTICS_TABLE,
      FilterExpression: "reliabilityScore > :zero",
      ExpressionAttributeValues: {
        ":zero": 0
      },
      ProjectionExpression: "userId, reliabilityScore"
    };

    let allUsers = [];
    let lastEvaluatedKey = undefined;

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const scanResult = await dynamoDB.send(new ScanCommand(scanParams));
      allUsers = allUsers.concat(scanResult.Items);
      lastEvaluatedKey = scanResult.LastEvaluatedKey;

      console.log(`Scanned ${allUsers.length} users so far...`);
    } while (lastEvaluatedKey);

    console.log(`Total users with scores: ${allUsers.length}`);

    if (allUsers.length === 0) {
      console.log("No users with scores, skipping leaderboard update");
      return {
        success: true,
        message: "No users to rank"
      };
    }

    // Step 2: Sort by reliability score (descending), then by userId (for tie-breaking)
    allUsers.sort((a, b) => {
      if (b.reliabilityScore !== a.reliabilityScore) {
        return b.reliabilityScore - a.reliabilityScore;
      }
      // Tie-breaker: lexicographic userId (consistent, deterministic)
      return a.userId.localeCompare(b.userId);
    });

    // Step 3: Assign ranks (handle ties properly)
    let currentRank = 1;
    let previousScore = null;

    const rankedUsers = allUsers.map((user, index) => {
      if (previousScore !== null && user.reliabilityScore !== previousScore) {
        // New score: advance rank
        currentRank = index + 1;
      }
      previousScore = user.reliabilityScore;

      return {
        ...user,
        rank: currentRank
      };
    });

    // Step 4: Fetch profile data for top 100 (batch operation)
    const top100Users = rankedUsers.slice(0, 100);
    const top100WithProfiles = await exports.enrichWithProfiles(top100Users);

    // Step 5: Cache top 100 in single item
    const cacheTimestamp = new Date().toISOString();

    const top100CacheParams = {
      TableName: LEADERBOARD_TABLE,
      Item: {
        cacheType: "GLOBAL_TOP_100",
        lastUpdated: cacheTimestamp,
        rankings: top100WithProfiles,
        totalUsers: allUsers.length,
        version: Date.now() // Use timestamp as version
      }
    };

    await dynamoDB.send(new PutCommand(top100CacheParams));
    console.log("Top 100 cached successfully");

    // Step 6: Cache individual user ranks (for users outside top 100)
    // Only cache a subset to avoid excessive writes (e.g., ranks 101-500)
    const usersToCache = rankedUsers.slice(100, 500);
    const usersWithProfiles = await exports.enrichWithProfiles(usersToCache);

    for (const user of usersWithProfiles) {
      const userCacheParams = {
        TableName: LEADERBOARD_TABLE,
        Item: {
          cacheType: `USER_RANK#${user.userId}`,
          lastUpdated: cacheTimestamp,
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          profilePictureUrl: user.profilePictureUrl,
          reliabilityScore: user.reliabilityScore,
          tags: user.tags || [],
          rank: user.rank,
          totalUsers: allUsers.length
        }
      };

      await dynamoDB.send(new PutCommand(userCacheParams));
    }

    console.log(`Cached ${usersWithProfiles.length} individual user ranks`);

    return {
      success: true,
      totalUsers: allUsers.length,
      top100Count: top100WithProfiles.length,
      cachedIndividualRanks: usersWithProfiles.length,
      timestamp: cacheTimestamp
    };
  } catch (error) {
    console.error("Error calculating leaderboard:", error);
    throw error;
  }
};

/**
 * Enrich user data with profile information
 */
exports.enrichWithProfiles = async (users) => {
  const enriched = [];

  for (const user of users) {
    try {
      // Query UserProfiles by userId GSI
      const profileParams = {
        TableName: PROFILES_TABLE,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": user.userId
        },
        Limit: 1
      };

      const profileResult = await dynamoDB.send(new QueryCommand(profileParams));
      const profile = profileResult.Items?.[0];

      enriched.push({
        rank: user.rank,
        userId: user.userId,
        username: profile?.username || "unknown",
        displayName: profile?.displayName || profile?.username || "Unknown User",
        profilePictureUrl: profile?.profilePictureUrl,
        reliabilityScore: user.reliabilityScore,
        tags: profile?.tags || []
      });
    } catch (error) {
      console.error(`Error fetching profile for user ${user.userId}:`, error);
      // Fallback to minimal data
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
};
