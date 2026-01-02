const STATUS_STYLES = {
  PENDING: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/50",
  REVIEW: "bg-blue-600/20 text-blue-400 border border-blue-600/50",
  COMPLETED: "bg-green-600/20 text-green-400 border border-green-600/50",
  FAILED: "bg-red-600/20 text-red-400 border border-red-600/50",
  REJECTED: "bg-red-600/20 text-red-400 border border-red-600/50",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs font-medium px-3 py-1 rounded-full ${
        STATUS_STYLES[status] || "bg-gray-700 text-gray-300 border border-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
