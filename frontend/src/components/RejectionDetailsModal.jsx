export default function RejectionDetailsModal({ task, onClose, onDispute }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Evidence Rejected</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[13px] text-gray-500 font-light mb-1">Task</p>
            <p className="text-[15px] font-normal text-white">{task.title}</p>
          </div>

          <div>
            <p className="text-[13px] text-gray-500 font-light mb-2">Rejection Reason</p>
            <p className="border-l border-red-400/60 pl-4 text-[14px] text-gray-300 font-light leading-relaxed">
              {task.validationResult?.rationale || "Evidence did not meet the requirements for this task."}
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            onClick={onDispute}
            className="flex-1 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
