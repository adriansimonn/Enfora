import { useState, useEffect } from "react";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "./ConfirmationModal";

export default function TaskDetailsModal({ task, onClose, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Task Details</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Status */}
          <div className="mb-8">
            <div className="mb-3">
              <StatusBadge status={task.status} />
            </div>
            <h3 className="text-2xl font-light text-white tracking-[-0.01em] leading-snug">{task.title}</h3>
          </div>

          <dl className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {/* Description */}
            <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
              <dt className="text-[13px] text-gray-500 font-light">Description</dt>
              <dd className="text-[14px] text-gray-200 font-light leading-relaxed">{task.description}</dd>
            </div>

            {/* Deadline */}
            <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
              <dt className="text-[13px] text-gray-500 font-light">Deadline</dt>
              <dd className="text-[14px] text-gray-200 font-light leading-relaxed">{new Date(task.deadline).toLocaleString()}</dd>
            </div>

            {/* Stake Information */}
            <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
              <dt className="text-[13px] text-gray-500 font-light">Stake Amount</dt>
              <dd className="text-[14px] text-gray-200 font-light leading-relaxed tabular-nums">${task.stakeAmount}</dd>
            </div>

            {/* Rejection Reason (show for REJECTED tasks) */}
            {task.status === "REJECTED" && task.validationResult?.rationale && (
              <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
                <dt className="text-[13px] text-gray-500 font-light">Rejection Reason</dt>
                <dd className="text-[14px] text-gray-200 font-light leading-relaxed">{task.validationResult.rationale}</dd>
              </div>
            )}

            {/* Review Information (show for tasks under human review) */}
            {task.status === "REVIEW" && task.validationResult?.rationale && (
              <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
                <dt className="text-[13px] text-gray-500 font-light">Initial Rejection Reason</dt>
                <dd className="text-[14px] text-gray-200 font-light leading-relaxed">{task.validationResult.rationale}</dd>
              </div>
            )}
            {task.status === "REVIEW" && task.disputeReasoning && (
              <div className="py-4 grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6">
                <dt className="text-[13px] text-gray-500 font-light">Your Dispute Reasoning</dt>
                <dd className="text-[14px] text-gray-200 font-light leading-relaxed">{task.disputeReasoning}</dd>
              </div>
            )}
          </dl>

          {task.status === "REVIEW" && (
            <p className="mt-6 border-l border-blue-400/60 pl-4 text-[13px] text-gray-300 font-light leading-relaxed">
              This task is currently under human review. You will not be charged until a decision has been made.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/[0.08] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
          {onDelete && task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 px-5 py-2.5 text-red-400 text-sm font-normal rounded-lg border border-red-400/30 hover:bg-red-400/[0.06] hover:border-red-400/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete Task
            </button>
          )}
          {onDelete && (task.status === 'COMPLETED' || task.status === 'FAILED') && (
            <div
              className="flex-1 text-center px-5 py-2.5 text-gray-600 text-sm font-normal rounded-lg border border-white/[0.06] cursor-not-allowed"
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        confirmButtonClass="bg-white text-black hover:bg-gray-100"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}
