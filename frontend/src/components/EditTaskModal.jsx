import { useState } from 'react';

export default function EditTaskModal({ task, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [stakeAmount, setStakeAmount] = useState(task.stakeAmount?.toString() || '');
  const [stakeDestination, setStakeDestination] = useState(task.stakeDestination || 'Charity');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSave({
        ...task,
        title,
        description,
        deadline,
        stakeAmount: parseFloat(stakeAmount),
        stakeDestination
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Task Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter a clear task title..."
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Task Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Describe the task you want to complete..."
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-2">
                Deadline
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-300 mb-2">
                Stake Amount ($)
              </label>
              <input
                id="stakeAmount"
                type="number"
                step="0.01"
                min="0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="stakeDestination" className="block text-sm font-medium text-gray-300 mb-2">
                Where should the money go if you fail?
              </label>
              <select
                id="stakeDestination"
                value={stakeDestination}
                onChange={(e) => setStakeDestination(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="Charity">Charity</option>
                <option value="A Friend">A Friend</option>
                <option value="Donate to Enfora">Donate to Enfora</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-medium rounded-lg transition-colors border border-red-600/50"
              >
                Delete Task
              </button>
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 bg-white disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-500 font-medium rounded-lg"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Delete Task?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
