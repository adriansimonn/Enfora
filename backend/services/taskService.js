const { v4: uuidv4 } = require("uuid");
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const dynamoDB = require("../config/dynamoClient");
const { calculateNextDueDate } = require("../utils/recurrenceHelper");
const { createTaskExpirationSchedule, deleteTaskExpirationSchedule } = require("./schedulerService");

const TABLE_NAME = "Tasks";

exports.createTask = async (task) => {
  const taskId = uuidv4();
  const status = "pending";
  const createdAt = new Date().toISOString();

  // Build taskItem based on whether it's recurring or not
  let taskItem;

  if (task.isRecurring && task.recurrenceRule) {
    // Recurring task
    if (task.repeatsUntil) {
      // Frontend sent both firstDueDate (as deadline) and repeatsUntil
      // Destructure to remove deadline, repeatsUntil, and other fields we'll override
      const { deadline: firstDueDate, repeatsUntil, dueDate: _, ...rest } = task;
      taskItem = {
        ...rest,
        taskId,
        status,
        createdAt,
        dueDate: firstDueDate, // First occurrence
        repeatsUntil: repeatsUntil, // When to stop repeating (DIFFERENT from deadline)
        deadline: firstDueDate, // Keep for compatibility
      };
    } else {
      // Old format: deadline is the repeatsUntil
      const { deadline, ...rest } = task;
      taskItem = {
        ...rest,
        taskId,
        status,
        createdAt,
        dueDate: deadline,
        repeatsUntil: deadline,
        deadline: deadline,
      };
    }
  } else {
    // Non-recurring task
    const { ...rest } = task;
    taskItem = {
      ...rest,
      taskId,
      status,
      createdAt,
      dueDate: task.deadline,
    };
  }

  const params = {
    TableName: TABLE_NAME,
    Item: taskItem,
  };

  try {
    await dynamoDB.send(new PutCommand(params));

    // Create EventBridge schedule for task expiration (use dueDate)
    const expirationDate = taskItem.dueDate;
    if (expirationDate && taskItem.userId && taskItem.taskId) {
      try {
        await createTaskExpirationSchedule(taskItem.userId, taskItem.taskId, expirationDate);
      } catch (scheduleError) {
        // If deadline is in the past, immediately mark task as failed
        if (scheduleError.isPastDeadline) {
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
 * Handle recurring task completion/failure
 * Creates a child task copy with the completed/failed status for metrics
 * Updates the parent task's dueDate to the next recurrence
 */
async function handleRecurringTaskCompletion(taskId, userId, newStatus, updateData = {}) {
  // Get the current task
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      userId: userId,
      taskId: taskId,
    },
  };

  const result = await dynamoDB.send(new GetCommand(getParams));
  const task = result.Item;

  if (!task) {
    throw new Error("Task not found");
  }

  // Only handle if this is a recurring parent task
  if (!task.isRecurring || !task.recurrenceRule) {
    return null;
  }

  // Create a child task copy with the completed/failed status
  const childTask = {
    ...task,
    taskId: uuidv4(),
    parentTaskId: task.taskId,
    status: newStatus,
    isRecurring: false,
    recurrenceRule: null,
    repeatsUntil: null,
    dueDate: task.dueDate, // Keep the original dueDate this was for
    deadline: task.dueDate, // Set deadline to the dueDate
    completedAt: newStatus === "completed" ? (updateData.completedAt || new Date().toISOString()) : null,
    failedAt: newStatus === "failed" ? (updateData.failedAt || new Date().toISOString()) : null,
    createdAt: new Date().toISOString(),
    submittedEvidenceURL: updateData.submittedEvidenceURL || task.submittedEvidenceURL,
    validationResult: updateData.validationResult || task.validationResult,
  };

  // Save the child task
  const childParams = {
    TableName: TABLE_NAME,
    Item: childTask,
  };

  await dynamoDB.send(new PutCommand(childParams));

  // Calculate next due date for the parent task
  const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrenceRule, task.repeatsUntil);

  if (nextDueDate) {
    // Update parent task with next due date and reset to pending
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        taskId: taskId,
      },
      UpdateExpression: "SET dueDate = :dueDate, #st = :status, #dl = :deadline REMOVE submittedEvidenceURL, validationResult, completedAt, failedAt, disputeReasoning, disputedAt",
      ExpressionAttributeNames: {
        "#st": "status",
        "#dl": "deadline",
      },
      ExpressionAttributeValues: {
        ":dueDate": nextDueDate.toISOString(),
        ":deadline": nextDueDate.toISOString(),
        ":status": "pending",
      },
      ReturnValues: "ALL_NEW",
    };

    // Delete the old schedule and create a new one for the next occurrence
    try {
      await deleteTaskExpirationSchedule(userId, taskId);
      await createTaskExpirationSchedule(userId, taskId, nextDueDate.toISOString());
    } catch (scheduleError) {
      console.error("Failed to update EventBridge schedule:", scheduleError);
    }

    return await dynamoDB.send(new UpdateCommand(updateParams));
  } else {
    // No more recurrences, mark parent task as completed/failed
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId,
        taskId: taskId,
      },
      UpdateExpression: "SET #st = :status",
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":status": newStatus,
      },
      ReturnValues: "ALL_NEW",
    };

    // Delete the schedule since recurrence is complete
    try {
      await deleteTaskExpirationSchedule(userId, taskId);
    } catch (scheduleError) {
      console.error("Failed to delete EventBridge schedule:", scheduleError);
    }

    return await dynamoDB.send(new UpdateCommand(updateParams));
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

  const task = existing.Item;

  // Check if this is a recurring task being completed or failed
  if (task.isRecurring && (updates.status === "completed" || updates.status === "failed")) {
    // Handle recurring task completion/failure
    const result = await handleRecurringTaskCompletion(taskId, userId, updates.status, updates);
    return result.Attributes;
  }

  // Build update expression dynamically for non-recurring tasks or other updates
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
  } catch (scheduleError) {
    console.error("Failed to delete EventBridge schedule:", scheduleError);
    // Don't fail the deletion if schedule deletion fails
  }

  return { success: true };
};

/**
 * Delete all tasks for a user (used during account deletion)
 */
exports.deleteAllTasksForUser = async (userId) => {
  try {
    // Get all tasks for the user
    const tasks = await exports.getTasksByUser(userId);

    if (!tasks || tasks.length === 0) {
      return { deletedCount: 0 };
    }

    // Delete tasks in batches (max 25 per batch for BatchWriteCommand)
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      const deleteRequests = batch.map(task => ({
        DeleteRequest: {
          Key: {
            userId: task.userId,
            taskId: task.taskId,
          }
        }
      }));

      const batchParams = {
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      };

      await dynamoDB.send(new BatchWriteCommand(batchParams));
      deletedCount += batch.length;

      // Delete EventBridge schedules for each task in the batch
      for (const task of batch) {
        try {
          await deleteTaskExpirationSchedule(userId, task.taskId);
        } catch (scheduleError) {
          console.error(`Failed to delete schedule for task ${task.taskId}:`, scheduleError);
          // Continue with other tasks even if schedule deletion fails
        }
      }
    }

    return { deletedCount };
  } catch (error) {
    console.error("Error deleting all tasks for user:", error);
    throw error;
  }
};