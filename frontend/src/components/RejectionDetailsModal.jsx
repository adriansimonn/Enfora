export default function RejectionDetailsModal({ task, onClose, onDispute }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Evidence Rejected
        </h2>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-300 mb-2">Task:</h3>
          <p className="text-white">{task.title}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-300 mb-2">Rejection Reason:</h3>
          <p className="text-gray-400 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
            {task.validationResult?.rationale || "Evidence did not meet the requirements for this task."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
          >
            Close
          </button>
          <button
            onClick={onDispute}
            className="flex-1 px-4 py-2.5 bg-white text-black font-semibold rounded-xl"
          >
            Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
