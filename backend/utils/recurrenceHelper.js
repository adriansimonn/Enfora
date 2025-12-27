/**
 * Helper functions for handling recurring tasks
 */

/**
 * Generate task instances from a recurring task
 * @param {Object} parentTask - The parent recurring task
 * @param {number} maxInstances - Maximum number of instances to generate (default: 52)
 * @returns {Array} Array of task instances
 */
function generateTaskInstances(parentTask, maxInstances = 52) {
  const { recurrenceRule, deadline } = parentTask;

  if (!recurrenceRule) {
    return [];
  }

  const instances = [];
  const startDate = new Date(deadline);
  const { frequency, interval, byWeekday, until, count } = recurrenceRule;

  const maxCount = count || maxInstances;
  const endDate = until ? new Date(until) : null;

  let currentDate = new Date(startDate);
  let instanceCount = 0;

  // Generate instances
  while (instanceCount < maxCount) {
    // Check if we've reached the end date
    if (endDate && currentDate > endDate) {
      break;
    }

    // Add current instance
    if (instanceCount > 0) { // Skip the first one as it's the parent task
      instances.push({
        ...parentTask,
        deadline: currentDate.toISOString(),
        parentTaskId: parentTask.taskId,
        isRecurring: false, // Individual instances are not recurring
        recurrenceRule: null,
        instanceNumber: instanceCount,
      });
    }

    instanceCount++;

    // Calculate next occurrence
    currentDate = getNextOccurrence(currentDate, frequency, interval, byWeekday);

    if (!currentDate) {
      break;
    }
  }

  return instances;
}

/**
 * Get the next occurrence date based on recurrence rule
 */
function getNextOccurrence(currentDate, frequency, interval, byWeekday) {
  const nextDate = new Date(currentDate);

  if (frequency === 'days') {
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  }

  if (frequency === 'weeks') {
    if (!byWeekday || byWeekday.length === 0) {
      // Simple weekly recurrence
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      return nextDate;
    }

    // Weekly recurrence with specific days
    const dayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
    const targetDays = byWeekday.map(d => dayMap[d]).sort((a, b) => a - b);
    const currentDay = nextDate.getDay();

    // Find next occurrence
    let daysToAdd = 0;
    let found = false;

    // Check remaining days in current week
    for (const targetDay of targetDays) {
      if (targetDay > currentDay) {
        daysToAdd = targetDay - currentDay;
        found = true;
        break;
      }
    }

    // If not found in current week, move to next week cycle
    if (!found) {
      const firstTargetDay = targetDays[0];
      const daysUntilNextWeek = (7 - currentDay) + firstTargetDay;
      daysToAdd = daysUntilNextWeek + (7 * (interval - 1));
    }

    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }

  return null;
}

/**
 * Format recurrence rule into human-readable text
 */
function formatRecurrenceRule(recurrenceRule) {
  if (!recurrenceRule) return null;

  const { frequency, interval, byWeekday, until, count } = recurrenceRule;
  let text = '';

  // Frequency part
  if (frequency === 'days') {
    text = interval === 1 ? 'Daily' : `Every ${interval} days`;
  } else if (frequency === 'weeks') {
    if (interval === 1) {
      text = 'Weekly';
    } else {
      text = `Every ${interval} weeks`;
    }

    if (byWeekday && byWeekday.length > 0) {
      const dayNames = { SU: 'Sun', MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat' };
      const days = byWeekday.map(d => dayNames[d]).join(', ');

      // Check if it's weekdays only
      const weekdaySet = ['MO', 'TU', 'WE', 'TH', 'FR'].sort().join(',');
      const currentSet = [...byWeekday].sort().join(',');

      if (currentSet === weekdaySet) {
        text = 'Every weekday';
      } else {
        text += ` on ${days}`;
      }
    }
  }

  // End condition
  if (until) {
    text += ` until ${new Date(until).toLocaleDateString()}`;
  } else if (count) {
    text += `, ${count} times`;
  }

  return text;
}

module.exports = {
  generateTaskInstances,
  getNextOccurrence,
  formatRecurrenceRule,
};
