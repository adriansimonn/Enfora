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

  const isEditable = task.status !== "COMPLETED" && task.status !== "REVIEW" && task.status !== "FAILED";

  const formatDateTime = (value) =>
    new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

  return (
    <div className="border-t border-white/[0.25] pt-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 min-h-[28px]">
        <StatusBadge status={task.status} />

        {/* Edit Button - hidden for completed, review, and failed tasks */}
        {isEditable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
            className="p-1.5 -mr-1.5 text-gray-500 hover:text-white transition-colors duration-200"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      <h3 className="text-[17px] font-normal text-white leading-snug mb-2">{task.title}</h3>

      <div className="text-[13px] text-gray-400 font-light leading-relaxed">
        {task.isRecurring && task.recurrenceRule ? (
          <>
            <div>Due: {formatDateTime(task.dueDate || task.deadline)}</div>
            <div>Repeats until: {formatDateTime(task.repeatsUntil || task.deadline)}</div>
          </>
        ) : (
          <div>Due: {formatDateTime(task.deadline)}</div>
        )}

        {task.isRecurring && task.recurrenceRule && (
          <div className="text-gray-500">{formatRecurrenceRule(task.recurrenceRule)}</div>
        )}

        {task.parentTaskId && (
          <div className="text-gray-500">Recurring instance</div>
        )}
      </div>

      <div className="mt-3 text-[13px] text-gray-400 font-light">
        Stake: <span className="text-white font-normal tabular-nums">${task.stakeAmount}</span>
      </div>

      <div className="flex-grow"></div>

      {isRejected ? (
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onAction?.(task)}
            className="flex-1 py-2 text-sm font-normal text-white bg-white/[0.03] rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
          >
            {buttonLabel}
          </button>
          <button
            onClick={() => onAction?.(task, true)}
            className="flex-1 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <button
          disabled={isActionDisabled}
          onClick={() => onAction?.(task)}
          className={`mt-5 py-2 text-sm rounded-lg transition-all duration-200
            ${
              isActionDisabled
                ? "bg-white/[0.03] text-gray-500 cursor-not-allowed border border-white/[0.08]"
                : task.status === "PENDING"
                ? "bg-white text-black font-medium hover:bg-gray-100"
                : "bg-white/[0.03] text-white font-normal border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]"
            }`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
