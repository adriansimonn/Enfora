export default function RejectionDetailsModal({ task, onClose, onDispute }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Evidence Rejected
        </h2>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Task:</h3>
          <p className="text-gray-700">{task.title}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Rejection Reason:</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            {task.validationResult?.rationale || "Evidence did not meet the requirements for this task."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={onDispute}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Dispute
          </button>
        </div>
      </div>
    </div>
  );
}
