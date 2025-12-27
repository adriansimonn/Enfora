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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Dispute Rejection
        </h2>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-300 mb-2">Task:</h3>
          <p className="text-white">{task.title}</p>
        </div>

        <div className="mb-6">
          <label className="block font-semibold text-gray-300 mb-2">
            Explain why you believe the evidence should be accepted:
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Provide your reasoning here..."
            className="w-full h-32 p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-white text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
