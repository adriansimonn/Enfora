import { useState, useEffect } from 'react';
import CustomRecurrenceModal from './CustomRecurrenceModal';
import Select from './Select';

export default function EditTaskModal({ task, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [repeatsUntil, setRepeatsUntil] = useState(task.repeatsUntil || '');
  const [stakeAmount, setStakeAmount] = useState(task.stakeAmount?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recurrence states
  const [recurrenceType, setRecurrenceType] = useState(() => {
    if (!task.isRecurring || !task.recurrenceRule) return 'does-not-repeat';
    const { frequency, interval, byWeekday } = task.recurrenceRule;

    if (frequency === 'days' && interval === 1) return 'daily';
    if (frequency === 'weeks' && interval === 1) {
      if (byWeekday?.length === 5 && ['MO', 'TU', 'WE', 'TH', 'FR'].every(d => byWeekday.includes(d))) {
        return 'weekdays';
      }
      if (byWeekday?.length === 1) return 'weekly';
    }
    return 'custom';
  });
  const [customRecurrenceRule, setCustomRecurrenceRule] = useState(
    task.recurrenceRule && recurrenceType === 'custom' ? task.recurrenceRule : null
  );
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);

  const getRecurrenceRule = () => {
    const deadlineDate = new Date(deadline);
    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][deadlineDate.getDay()];

    switch (recurrenceType) {
      case 'does-not-repeat':
        return null;
      case 'daily':
        return { frequency: 'days', interval: 1 };
      case 'weekly':
        return { frequency: 'weeks', interval: 1, byWeekday: [dayOfWeek] };
      case 'weekdays':
        return { frequency: 'weeks', interval: 1, byWeekday: ['MO', 'TU', 'WE', 'TH', 'FR'] };
      case 'custom':
        return customRecurrenceRule;
      default:
        return null;
    }
  };

  const handleRecurrenceChange = (value) => {
    setRecurrenceType(value);
    if (value === 'custom') {
      setShowCustomRecurrence(true);
    }
  };

  const handleCustomRecurrenceSave = (rule) => {
    setCustomRecurrenceRule(rule);
    setRecurrenceType('custom');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const recurrenceRule = getRecurrenceRule();

      // Convert datetime-local to ISO string with timezone
      const deadlineDate = new Date(deadline);
      const deadlineISO = deadlineDate.toISOString();

      const taskData = {
        ...task,
        title,
        description,
        deadline: deadlineISO,
        stakeAmount: parseFloat(stakeAmount),
        recurrenceRule,
        isRecurring: recurrenceRule !== null
      };

      // For recurring tasks, add repeatsUntil
      if (recurrenceRule !== null && repeatsUntil) {
        const repeatsUntilDate = new Date(repeatsUntil);
        taskData.repeatsUntil = repeatsUntilDate.toISOString();
      }

      await onSave(taskData);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-[13px] font-normal text-gray-300 mb-2">
                Task Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                placeholder="Enter a clear task title..."
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-[13px] font-normal text-gray-300 mb-2">
                Task Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 resize-none"
                placeholder="Describe the task you want to complete..."
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-[13px] font-normal text-gray-300 mb-2">
                {recurrenceType !== 'does-not-repeat' ? 'First Due Date' : 'Deadline'}
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 [color-scheme:dark]"
              />
            </div>

            {recurrenceType !== 'does-not-repeat' && (
              <div>
                <label htmlFor="repeatsUntil" className="block text-[13px] font-normal text-gray-300 mb-2">
                  Repeats Until
                </label>
                <input
                  id="repeatsUntil"
                  type="datetime-local"
                  value={repeatsUntil}
                  onChange={(e) => setRepeatsUntil(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 [color-scheme:dark]"
                />
                <p className="mt-2 text-[12px] text-gray-500 font-light">
                  The task will repeat until this date. Make sure this is after the first due date.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="stakeAmount" className="block text-[13px] font-normal text-gray-300 mb-2">
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
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 tabular-nums"
                placeholder="0.00"
              />
              <p className="mt-2 text-[12px] text-gray-500 font-light">
                If you fail to complete this task, you'll be charged this amount.
              </p>
            </div>

            {!task.parentTaskId && (
            <div>
                <label htmlFor="recurrence" className="block text-[13px] font-normal text-gray-300 mb-2">
                  Recurrence
                </label>
                <Select
                  id="recurrence"
                  value={recurrenceType}
                  onChange={handleRecurrenceChange}
                  options={[
                    { value: 'does-not-repeat', label: 'Does not repeat' },
                    { value: 'daily', label: 'Daily' },
                    {
                      value: 'weekly',
                      label: `Weekly on ${deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'long' }) : '...'}`,
                    },
                    { value: 'weekdays', label: 'Every weekday (Monday to Friday)' },
                    { value: 'custom', label: 'Custom...' },
                  ]}
                  className="w-full px-4 py-2.5 text-[15px]"
                />
              </div>
            )}

            {task.parentTaskId && (
              <p className="border-l border-white/[0.15] pl-4 text-[13px] text-gray-400 font-light leading-relaxed">
                This is a recurring task instance. Recurrence settings cannot be edited for individual instances.
              </p>
            )}

            {error && (
              <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {task.status !== 'COMPLETED' && task.status !== 'FAILED' ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-5 py-2.5 text-red-400 text-sm font-normal rounded-lg border border-red-400/30 hover:bg-red-400/[0.06] hover:border-red-400/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete Task
                </button>
              ) : (
                <div className="px-5 py-2.5 text-gray-600 text-sm font-normal rounded-lg border border-white/[0.06] cursor-not-allowed" title="Completed and failed tasks cannot be deleted to maintain metric integrity">
                  Delete Task
                </div>
              )}
              <div className="flex-1"></div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-light text-white tracking-[-0.01em] mb-2">Delete Task?</h3>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
            </div>

            {error && (
              <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed mb-6">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showCustomRecurrence && (
        <CustomRecurrenceModal
          onClose={() => setShowCustomRecurrence(false)}
          onSave={handleCustomRecurrenceSave}
          initialRule={customRecurrenceRule}
        />
      )}
    </div>
  );
}
