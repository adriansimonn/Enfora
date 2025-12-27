import { useState } from "react";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "./ConfirmationModal";

export default function TaskDetailsModal({ task, onClose, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{task.title}</h3>
                <StatusBadge status={task.status} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300">
              {task.description}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Deadline
            </label>
            <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300">
              {new Date(task.deadline).toLocaleString()}
            </div>
          </div>

          {/* Stake Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Stake Amount
              </label>
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300">
                ${task.stakeAmount}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Stake Destination
              </label>
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-gray-300">
                {task.stakeDestination || 'Not specified'}
              </div>
            </div>
          </div>

          {/* Rejection Reason (show for REJECTED tasks) */}
          {task.status === "REJECTED" && task.validationResult?.rationale && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Rejection Reason
              </label>
              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                <p className="text-gray-300 text-sm">
                  {task.validationResult.rationale}
                </p>
              </div>
            </div>
          )}

          {/* Review Information (show for tasks under human review) */}
          {task.status === "REVIEW" && (
            <>
              {task.validationResult?.rationale && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Initial Rejection Reason
                  </label>
                  <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <p className="text-gray-300 text-sm">
                      {task.validationResult.rationale}
                    </p>
                  </div>
                </div>
              )}
              {task.disputeReasoning && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Your Dispute Reasoning
                  </label>
                  <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <p className="text-gray-300 text-sm">
                      {task.disputeReasoning}
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-blue-300 text-sm">
                  This task is currently under human review. You will not be charged until a decision has been made.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
          {onDelete && task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Task
            </button>
          )}
          {onDelete && (task.status === 'COMPLETED' || task.status === 'FAILED') && (
            <div
              className="flex-1 px-4 py-3 bg-zinc-800/50 text-gray-500 font-semibold rounded-lg cursor-not-allowed border border-zinc-700 text-center"
              title="Completed and failed tasks cannot be deleted to maintain metric integrity"
            >
              Delete Task
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            await onDelete(task);
            onClose();
          } catch (error) {
            setErrorMessage('Failed to delete task. Please try again.');
            setShowErrorModal(true);
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      {/* Error Modal */}
      <ConfirmationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        cancelText="Close"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}
