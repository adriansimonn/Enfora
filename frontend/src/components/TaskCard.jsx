import StatusBadge from "./StatusBadge";

export default function TaskCard({ task, onAction, onEdit }) {
  const isActionDisabled = false; // All tasks should be clickable
  const isRejected = task.status === "REJECTED";

  const buttonLabel =
    task.status === "PENDING"
      ? "Submit Evidence"
      : task.status === "REVIEW"
      ? "View Details"
      : task.status === "REJECTED"
      ? "View Details"
      : task.status === "COMPLETED"
      ? "View Details"
      : task.status === "FAILED"
      ? "View Details"
      : "View Details";

  const formatRecurrenceRule = (recurrenceRule) => {
    if (!recurrenceRule) return null;

    const { frequency, interval, byWeekday, until, count } = recurrenceRule;
    let text = '';

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

        const weekdaySet = ['MO', 'TU', 'WE', 'TH', 'FR'].sort().join(',');
        const currentSet = [...byWeekday].sort().join(',');

        if (currentSet === weekdaySet) {
          text = 'Every weekday';
        } else {
          text += ` on ${days}`;
        }
      }
    }

    if (until) {
      text += ` until ${new Date(until).toLocaleDateString()}`;
    } else if (count) {
      text += `, ${count} times`;
    }

    return text;
  };

  return (
    <div className="rounded-xl border border-zinc-700 p-5 shadow-lg bg-zinc-900/80 backdrop-blur flex flex-col gap-3 hover:border-zinc-600 transition-all duration-300 hover:transform hover:scale-105 relative h-full">
      {/* Edit Button - hidden for completed, review, and failed tasks */}
      {task.status !== "COMPLETED" && task.status !== "REVIEW" && task.status !== "FAILED" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(task);
          }}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          title="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      <div className={`flex justify-between items-start ${task.status !== "COMPLETED" && task.status !== "REVIEW" && task.status !== "FAILED" ? "pr-8" : ""}`}>
        <h3 className="font-semibold text-lg text-white">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>

      <div className="text-sm text-gray-400">
        Due: {new Date(task.deadline).toLocaleString(undefined, {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        })}
      </div>

      {task.isRecurring && task.recurrenceRule && (
        <div className="flex items-center gap-1.5 text-sm text-blue-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{formatRecurrenceRule(task.recurrenceRule)}</span>
        </div>
      )}

      {task.parentTaskId && (
        <div className="flex items-center gap-1.5 text-sm text-purple-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Recurring instance</span>
        </div>
      )}

      <div className="font-medium text-gray-300">
        Stake: ${task.stakeAmount}
      </div>

      <div className="flex-grow"></div>

      {isRejected ? (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onAction?.(task)}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-white text-black"
          >
            {buttonLabel}
          </button>
          <button
            onClick={() => onAction?.(task, true)}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          disabled={isActionDisabled}
          onClick={() => onAction?.(task)}
          className={`mt-2 rounded-lg py-2.5 text-sm font-semibold
            ${
              isActionDisabled
                ? "bg-zinc-800 text-gray-500 cursor-not-allowed border border-zinc-700"
                : "bg-white text-black"
            }`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
