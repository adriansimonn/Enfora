import StatusBadge from "./StatusBadge";

export default function TaskCard({ task, onAction }) {
  const isActionDisabled =
    task.status === "COMPLETED" || task.status === "FAILED" || task.status === "REVIEW";

  const buttonLabel =
    task.status === "PENDING"
      ? "Submit Evidence"
      : task.status === "REVIEW"
      ? "Under Review"
      : task.status === "REJECTED"
      ? "View Details"
      : "View Details";

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>

      <div className="text-sm text-gray-600">
        Due: {new Date(task.deadline).toLocaleString()}
      </div>

      <div className="font-medium">
        Stake: ${task.stakeAmount}
      </div>

      <button
        disabled={isActionDisabled}
        onClick={() => onAction?.(task)}
        className={`mt-2 rounded-lg py-2 text-sm font-medium transition
          ${
            isActionDisabled
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
