const { PutCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");
const taskService = require("./taskService");

const ANALYTICS_TABLE = "UserAnalytics";

/**
 * Calculate all analytics metrics for a user based on their tasks
 */
async function calculateAnalytics(userId) {
  // Fetch all tasks for the user
  const tasks = await taskService.getTasksByUser(userId);

  // Initialize metrics
  const metrics = {
    // Overall metrics
    reliabilityScore: 0,
    disciplineScore: 0,

    // Completion metrics
    completionRate: 0,
    averageCompletionTimeBeforeDeadline: 0,
    currentCompletionStreak: 0,

    // Financial metrics
    totalStakeLost: 0,
    totalStakeAtRisk: 0,
    averageStakePerTask: 0,
    totalMoneyToCharity: 0
  };

  // Categorize tasks
  const completedTasks = tasks.filter(t => t.status === "completed");
  const failedTasks = tasks.filter(t => t.status === "failed");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const reviewTasks = tasks.filter(t => t.status === "review");

  // Calculate discipline score
  metrics.disciplineScore = completedTasks.length - failedTasks.length;

  // Calculate completion rate (only completed and failed tasks)
  const finishedTasks = completedTasks.length + failedTasks.length;
  if (finishedTasks > 0) {
    metrics.completionRate = (completedTasks.length / finishedTasks) * 100;
  }

  // Calculate average completion time before deadline
  let totalTimeBeforeDeadline = 0;
  let tasksWithCompletionTime = 0;

  completedTasks.forEach(task => {
    if (task.completedAt && task.deadline) {
      const completedTime = new Date(task.completedAt).getTime();
      const deadlineTime = new Date(task.deadline).getTime();
      const timeBeforeDeadline = (deadlineTime - completedTime) / (1000 * 60 * 60); // in hours

      if (timeBeforeDeadline >= 0) {
        totalTimeBeforeDeadline += timeBeforeDeadline;
        tasksWithCompletionTime++;
      }
    }
  });

  if (tasksWithCompletionTime > 0) {
    metrics.averageCompletionTimeBeforeDeadline = totalTimeBeforeDeadline / tasksWithCompletionTime;
  }

  // Calculate current completion streak
  // Sort tasks by completion/failure date (most recent first)
  const finishedTasksSorted = [...completedTasks, ...failedTasks].sort((a, b) => {
    const dateA = new Date(a.completedAt || a.failedAt || 0);
    const dateB = new Date(b.completedAt || b.failedAt || 0);
    return dateB - dateA;
  });

  let streak = 0;
  for (const task of finishedTasksSorted) {
    if (task.status === "completed") {
      streak++;
    } else {
      break; // Streak broken by a failed task
    }
  }
  metrics.currentCompletionStreak = streak;

  // Calculate financial metrics
  // Total stake lost (from all failed tasks)
  metrics.totalStakeLost = failedTasks.reduce((sum, task) => sum + (task.stakeAmount || 0), 0);

  // Total stake at risk (from pending and review tasks)
  metrics.totalStakeAtRisk = [...pendingTasks, ...reviewTasks].reduce((sum, task) => sum + (task.stakeAmount || 0), 0);

  // Average stake per task
  if (tasks.length > 0) {
    const totalStake = tasks.reduce((sum, task) => sum + (task.stakeAmount || 0), 0);
    metrics.averageStakePerTask = totalStake / tasks.length;
  }

  // Total money sent to charity
  metrics.totalMoneyToCharity = failedTasks
    .filter(task => task.stakeDestination === "charity")
    .reduce((sum, task) => sum + (task.stakeAmount || 0), 0);

  // Add finished tasks count for frontend calculations
  metrics.finishedTasksCount = finishedTasks;

  // Add pending tasks count for frontend calculations
  metrics.pendingTasksCount = pendingTasks.length + reviewTasks.length;

  // Calculate Enfora Reliability Score (ERS)
  // Measures long-term consistency and discipline
  const completionRateDecimal = metrics.completionRate / 100; // Convert percentage to 0-1 range
  const tasksCompleted = completedTasks.length;
  const currentStreak = metrics.currentCompletionStreak;
  const disciplineScore = metrics.disciplineScore;

  if (completionRateDecimal <= 0) {
    metrics.reliabilityScore = 0;
  } else {
    // Prevent negative discipline from inflating score
    const disciplineTerm = Math.sqrt(Math.max(disciplineScore, 0));

    const completionTerm = Math.pow(completionRateDecimal, 1.5);

    const volumeTerm = Math.log(1 + tasksCompleted);

    const streakBonus = 1 + 0.15 * Math.log(1 + currentStreak);

    const score = 100 * disciplineTerm * completionTerm * volumeTerm * streakBonus;

    metrics.reliabilityScore = Math.round(score);
  }

  return metrics;
}

/**
 * Get or create analytics for a user
 */
exports.getUserAnalytics = async (userId) => {
  try {
    // Try to get existing analytics
    const params = {
      TableName: ANALYTICS_TABLE,
      Key: { userId }
    };

    const result = await dynamoDB.send(new GetCommand(params));

    if (result.Item) {
      // Recalculate analytics to ensure they're up to date
      const metrics = await calculateAnalytics(userId);

      // Update the analytics in DynamoDB
      const updateParams = {
        TableName: ANALYTICS_TABLE,
        Key: { userId },
        Item: {
          userId,
          ...metrics,
          lastUpdated: new Date().toISOString()
        }
      };

      await dynamoDB.send(new PutCommand(updateParams));

      return {
        userId,
        ...metrics,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Create new analytics entry
      const metrics = await calculateAnalytics(userId);

      const createParams = {
        TableName: ANALYTICS_TABLE,
        Item: {
          userId,
          ...metrics,
          lastUpdated: new Date().toISOString()
        }
      };

      await dynamoDB.send(new PutCommand(createParams));

      return {
        userId,
        ...metrics,
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error("Error getting user analytics:", error);
    throw error;
  }
};

/**
 * Update analytics after a task status change
 * This should be called whenever a task is completed, failed, or deleted
 */
exports.refreshUserAnalytics = async (userId) => {
  try {
    const metrics = await calculateAnalytics(userId);

    const params = {
      TableName: ANALYTICS_TABLE,
      Key: { userId },
      Item: {
        userId,
        ...metrics,
        lastUpdated: new Date().toISOString()
      }
    };

    await dynamoDB.send(new PutCommand(params));

    return {
      userId,
      ...metrics,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error refreshing user analytics:", error);
    throw error;
  }
};
