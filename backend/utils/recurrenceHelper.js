/**
 * Helper functions for handling recurring tasks
 */

/**
 * Calculate the next due date for a recurring task
 * @param {Date} currentDueDate - The current due date
 * @param {Object} recurrenceRule - The recurrence rule
 * @param {Date} repeatsUntil - The deadline (date until which the task should repeat)
 * @returns {Date|null} Next due date or null if past the repeatsUntil date
 */
function calculateNextDueDate(currentDueDate, recurrenceRule, repeatsUntil) {
  if (!recurrenceRule) {
    return null;
  }

  const { frequency, interval, byWeekday } = recurrenceRule;
  const nextDate = getNextOccurrence(new Date(currentDueDate), frequency, interval, byWeekday);

  if (!nextDate) {
    return null;
  }

  // Check if next occurrence is past the repeatsUntil date
  const untilDate = new Date(repeatsUntil);
  if (nextDate > untilDate) {
    return null;
  }

  return nextDate;
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
  calculateNextDueDate,
  getNextOccurrence,
  formatRecurrenceRule,
};
