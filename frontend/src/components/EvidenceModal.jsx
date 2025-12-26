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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-2">
          Submit Evidence
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Task: <span className="font-medium">{task.title}</span>
        </p>

        <input
          type="file"
          accept="image/*,.pdf"
          disabled={loading}
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full text-sm"
        />

        {file && (
          <p className="text-sm text-gray-700 mb-2">
            Selected: {file.name}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 mb-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className={`px-4 py-2 text-sm rounded-lg text-white
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }
            `}
          >
            {loading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}