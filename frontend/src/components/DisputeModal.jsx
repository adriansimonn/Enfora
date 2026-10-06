import { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";

export default function DisputeModal({ task, onClose, onSubmit }) {
  const [reasoning, setReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    if (!reasoning.trim()) {
      setErrorMessage("Please provide your reasoning for the dispute.");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(task, reasoning);
      setReasoning("");
      onClose();
    } catch (error) {
      console.error("Failed to submit dispute:", error);
      setErrorMessage("Failed to submit dispute. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">
            Dispute Rejection
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[13px] text-gray-500 font-light mb-1">Task</p>
            <p className="text-[15px] font-normal text-white">{task.title}</p>
          </div>

          <div>
            <label className="block text-[13px] font-normal text-gray-300 mb-2">
              Explain why you believe the evidence should be accepted:
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Provide your reasoning here..."
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 h-32 resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>

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
