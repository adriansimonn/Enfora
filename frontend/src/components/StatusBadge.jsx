const STATUS_STYLES = {
  PENDING: "bg-yellow-400",
  REVIEW: "bg-blue-400",
  COMPLETED: "bg-green-400",
  FAILED: "bg-red-400",
  REJECTED: "bg-red-400",
};

export default function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status] || "bg-gray-500"}`} />
      {status}
    </span>
  );
}
