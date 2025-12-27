import { useState } from "react";

export default function EvidenceModal({ task, onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit(task, file);
    } catch (err) {
      setError("Upload failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            Submit Evidence
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Task: <span className="font-medium text-gray-300">{task.title}</span>
        </p>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Evidence
          </label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,.docx,.txt,.md"
            disabled={loading}
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black file:cursor-pointer cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-2">
            Accepted formats: PNG, JPEG, JPG, PDF, DOCX, TXT, MD (Max 10MB)
          </p>
        </div>

        {file && (
          <p className="text-sm text-gray-300 mb-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
            Selected: {file.name}
          </p>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-black disabled:bg-zinc-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
