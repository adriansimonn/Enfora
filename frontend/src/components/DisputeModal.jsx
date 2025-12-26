import { useState } from "react";

export default function DisputeModal({ task, onClose, onSubmit }) {
  const [reasoning, setReasoning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reasoning.trim()) {
      alert("Please provide your reasoning for the dispute.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(task, reasoning);
      setReasoning("");
      onClose();
    } catch (error) {
      console.error("Failed to submit dispute:", error);
      alert("Failed to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          Dispute Rejection
        </h2>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Task:</h3>
          <p className="text-gray-700">{task.title}</p>
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Explain why you believe the evidence should be accepted:
          </label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Provide your reasoning here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit for Human Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
