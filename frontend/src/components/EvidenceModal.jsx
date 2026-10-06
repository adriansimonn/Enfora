import { useState, useEffect } from "react";

export default function EvidenceModal({ task, onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Check if task deadline has passed
      const now = new Date();
      const deadline = new Date(task.deadline);

      if (now > deadline) {
        setError("This task has expired. You can no longer submit evidence.");
        setLoading(false);

        // Call onSubmit with expired flag to trigger backend update
        try {
          await onSubmit(task, null, true);
        } catch (expiredErr) {
          console.error("Failed to update expired task:", expiredErr);
        }
        return;
      }

      await onSubmit(task, file);
    } catch (err) {
      // Check if it's a metadata validation error
      if (err.message && (err.message.includes("created before") || err.message.includes("modified before"))) {
        setError("Nice try. You can't submit old evidence.");
      } else {
        setError("Upload failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">
            Submit Evidence
          </h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[13px] text-gray-500 font-light mb-1">Task</p>
            <p className="text-[15px] font-normal text-white">{task.title}</p>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-[13px] font-normal text-gray-300 mb-2">
              Upload Evidence
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.docx,.txt,.md"
              disabled={loading}
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-[13px] text-gray-400 font-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-solid file:border-white/[0.08] file:bg-white/[0.03] file:text-white file:text-sm file:font-normal hover:file:bg-white/[0.06] file:transition-colors file:cursor-pointer cursor-pointer"
            />
            <p className="mt-2 text-[12px] text-gray-500 font-light">
              Accepted formats: PNG, JPEG, JPG, PDF, DOCX, TXT, MD (Max 10MB)
            </p>
          </div>

          {file && (
            <p className="border-l border-white/[0.15] pl-4 text-[13px] text-gray-400 font-light leading-relaxed">
              Selected: <span className="text-gray-200">{file.name}</span>
            </p>
          )}

          {error && (
            <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
