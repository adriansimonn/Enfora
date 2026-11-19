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

/**
 * Internal: writes every key in `updates`, including status. Only pass values the
 * server built. An edit requested by a user goes through validateTaskEdit and
 * applyTaskEdit below.
 */
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

/**
 * USER EDITS
 *
 * A user may change the fields handled in validateTaskEdit and nothing else.
 * Status, timestamps, evidence and validation results are only written by the server.
 */
const EDITABLE_STATUSES = ["pending", "rejected"];
const RECURRENCE_FREQUENCIES = ["days", "weeks"];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/**
 * A refused edit. `status` is the HTTP status to answer with and `message` is safe
 * to show to the user.
 */
class TaskEditError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "TaskEditError";
    this.status = status;
  }
}
exports.TaskEditError = TaskEditError;

exports.getTask = async (taskId, userId) => {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, taskId },
    })
  );
  return result.Item;
};

function parseDate(value) {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRecurrenceRule(rule) {
  if (rule === null) {
    return null;
  }

  const invalid = (problem) => new TaskEditError(400, `recurrenceRule ${problem}`);

  if (typeof rule !== "object" || Array.isArray(rule)) {
    throw invalid("must be an object or null");
  }

  const { frequency, interval, byWeekday, until, count } = rule;

  if (!RECURRENCE_FREQUENCIES.includes(frequency)) {
    throw invalid("frequency must be days or weeks");
  }
  if (!Number.isInteger(interval) || interval < 1) {
    throw invalid("interval must be a whole number of 1 or more");
  }

  const parsed = { frequency, interval };

  if (byWeekday != null) {
    if (!Array.isArray(byWeekday) || !byWeekday.every((day) => WEEKDAYS.includes(day))) {
      throw invalid("byWeekday must be a list of weekdays");
    }
    if (byWeekday.length > 0) {
      parsed.byWeekday = byWeekday;
    }
  }
  if (until != null && until !== "") {
    if (!parseDate(until)) {
      throw invalid("until must be a date");
    }
    parsed.until = until;
  }
  if (count != null) {
    if (!Number.isInteger(count) || count < 1) {
      throw invalid("count must be a whole number of 1 or more");
    }
    parsed.count = count;
  }

  return parsed;
}

/**
 * Check that `task` may be edited and reduce a request body to the edits it is
 * allowed to make. Fields that are not editable are ignored.
 * Throws TaskEditError if the task is not editable or a value is invalid.
 */
exports.validateTaskEdit = (task, body, now = new Date()) => {
  // Compared case-insensitively because rows edited before this check existed can
  // hold an upper-cased status.
  if (!EDITABLE_STATUSES.includes(String(task.status).toLowerCase())) {
    throw new TaskEditError(409, "This task can no longer be edited");
  }

  // Once the deadline has passed the stake is owed, even if the expiry Lambda has
  // not marked the task failed yet.
  if (new Date(task.dueDate || task.deadline) <= now) {
    throw new TaskEditError(409, "This task's deadline has passed, so it can no longer be edited");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new TaskEditError(400, "Request body must be an object");
  }

  const edits = {};

  for (const field of ["title", "description"]) {
    if (body[field] === undefined) {
      continue;
    }
    if (typeof body[field] !== "string" || !body[field].trim()) {
      throw new TaskEditError(400, `${field} must be a non-empty string`);
    }
    edits[field] = body[field];
  }

  if (body.stakeAmount !== undefined) {
    // Must be a real number. The expiry Lambda reads the stored stake as a DynamoDB
    // number, so any other type would be treated as no stake and never charged.
    if (typeof body.stakeAmount !== "number" || !Number.isFinite(body.stakeAmount) || body.stakeAmount < 0) {
      throw new TaskEditError(400, "stakeAmount must be a number of 0 or more");
    }
    edits.stakeAmount = body.stakeAmount;
  }

  if (body.deadline !== undefined) {
    const deadline = parseDate(body.deadline);
    if (!deadline) {
      throw new TaskEditError(400, "deadline must be a valid date");
    }
    if (deadline <= now) {
      throw new TaskEditError(400, "deadline must be in the future");
    }
    edits.deadline = deadline.toISOString();
  }

  if (body.recurrenceRule !== undefined) {
    edits.recurrenceRule = parseRecurrenceRule(body.recurrenceRule);
    edits.isRecurring = edits.recurrenceRule !== null;
  }

  if (body.repeatsUntil != null) {
    const repeatsUntil = parseDate(body.repeatsUntil);
    if (!repeatsUntil) {
      throw new TaskEditError(400, "repeatsUntil must be a valid date");
    }
    edits.repeatsUntil = repeatsUntil.toISOString();
  }

  if (edits.recurrenceRule && !edits.repeatsUntil && !task.repeatsUntil) {
    throw new TaskEditError(400, "repeatsUntil is required for a recurring task");
  }

  if (Object.keys(edits).length === 0) {
    throw new TaskEditError(400, "No editable fields provided");
  }

  return edits;
};

/**
 * Save edits returned by validateTaskEdit for the `task` they were validated against.
 * Returns the updated task. Throws TaskEditError if the task's status changed since
 * `task` was read.
 */
exports.applyTaskEdit = async (task, edits) => {
  const { userId, taskId } = task;
  const updates = { ...edits };

  // The deadline is stored twice. dueDate is the copy the evidence deadline check
  // and the expiry schedule follow, so the two must move together.
  const previousDeadline = task.dueDate || task.deadline;
  if (edits.deadline !== undefined) {
    updates.dueDate = edits.deadline;
  }
  const deadlineMoved =
    edits.deadline !== undefined &&
    new Date(edits.deadline).getTime() !== new Date(previousDeadline).getTime();

  // Rows edited before validateTaskEdit existed can hold "PENDING", which the expiry
  // Lambda and analytics do not recognise. Put the lowercase value back.
  const canonicalStatus = task.status.toLowerCase();
  if (task.status !== canonicalStatus) {
    updates.status = canonicalStatus;
  }

  const moveSchedule = async (deadline) => {
    await deleteTaskExpirationSchedule(userId, taskId);
    await createTaskExpirationSchedule(userId, taskId, deadline);
  };
  const restoreSchedule = async () => {
    try {
      await moveSchedule(previousDeadline);
    } catch (restoreError) {
      console.error("Failed to restore EventBridge schedule after a failed edit:", restoreError);
    }
  };

  // Move the schedule first and save second. A deadline saved without its schedule
  // would be charged at the old time, or never. If either step fails the schedule
  // is put back and the edit is not saved.
  if (deadlineMoved) {
    try {
      await moveSchedule(edits.deadline);
    } catch (scheduleError) {
      await restoreSchedule();
      throw scheduleError;
    }
  }

  const expressionAttributeNames = { "#st": "status" };
  const expressionAttributeValues = { ":expectedStatus": task.status };
  const assignments = Object.keys(updates).map((key, index) => {
    expressionAttributeNames[`#field${index}`] = key;
    expressionAttributeValues[`:value${index}`] = updates[key];
    return `#field${index} = :value${index}`;
  });

  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, taskId },
        UpdateExpression: `SET ${assignments.join(", ")}`,
        // Refuse the write if the task was completed, failed or deleted after it was read
        ConditionExpression: "#st = :expectedStatus",
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  } catch (error) {
    if (deadlineMoved) {
      await restoreSchedule();
    }
    if (error.name === "ConditionalCheckFailedException") {
      throw new TaskEditError(409, "This task changed while it was being edited. Reload and try again.");
    }
    throw error;
  }
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