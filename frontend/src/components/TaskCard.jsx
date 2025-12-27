import StatusBadge from "./StatusBadge";

export default function TaskCard({ task, onAction, onEdit }) {
  const isActionDisabled = task.status === "FAILED";

  const buttonLabel =
    task.status === "PENDING"
      ? "Submit Evidence"
      : task.status === "REVIEW"
      ? "View Details"
      : task.status === "REJECTED"
      ? "View Details"
      : task.status === "COMPLETED"
      ? "View Details"
      : "View Details";

  return (
    <div className="rounded-xl border border-zinc-700 p-5 shadow-lg bg-zinc-900/80 backdrop-blur flex flex-col gap-3 hover:border-zinc-600 transition-all duration-300 hover:transform hover:scale-105 relative">
      {/* Edit Button - hidden for completed and review tasks */}
      {task.status !== "COMPLETED" && task.status !== "REVIEW" && (
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

      <div className={`flex justify-between items-start ${task.status !== "COMPLETED" && task.status !== "REVIEW" ? "pr-8" : ""}`}>
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

      <div className="font-medium text-gray-300">
        Stake: ${task.stakeAmount}
      </div>

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
    </div>
  );
}
