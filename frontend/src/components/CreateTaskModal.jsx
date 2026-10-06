import { useState, useEffect } from 'react';
import CustomRecurrenceModal from './CustomRecurrenceModal';
import Select from './Select';
import PaymentMethodRequired from './PaymentMethodRequired';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import { getPaymentMethod } from '../services/payment';

export default function CreateTaskModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [repeatsUntil, setRepeatsUntil] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('does-not-repeat');
  const [customRecurrenceRule, setCustomRecurrenceRule] = useState(null);
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  useEffect(() => {
    checkPaymentMethod();
  }, []);

  const checkPaymentMethod = async () => {
    try {
      const method = await getPaymentMethod();
      setHasPaymentMethod(!!method);
    } catch (error) {
      console.error('Failed to check payment method:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

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

    // Check if payment method is required
    if (parseFloat(stakeAmount) > 0 && !hasPaymentMethod) {
      setShowPaymentRequired(true);
      return;
    }

    setLoading(true);

    try {
      const recurrenceRule = getRecurrenceRule();

      // Convert datetime-local to ISO string with timezone
      const deadlineDate = new Date(deadline);
      const deadlineISO = deadlineDate.toISOString();

      const taskData = {
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

      await onSubmit(taskData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left column: what the task is */}
            <div className="flex flex-col gap-6">
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

              <div className="flex flex-col flex-1">
                <label htmlFor="description" className="block text-[13px] font-normal text-gray-300 mb-2">
                  Task Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="flex-1 w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 resize-none"
                  placeholder="Describe the task you want to complete..."
                />
              </div>
            </div>

            {/* Right column: when it's due and what's at stake */}
            <div className="space-y-6">
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
            </div>
          </div>

          {error && (
            <p className="mt-6 border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">{error}</p>
          )}

          {/* Agreement + Actions */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center gap-6 border-t border-white/[0.08] pt-6">
            <div className="flex items-start gap-3 flex-1">
              <input
                type="checkbox"
                id="agreement"
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0 accent-white cursor-pointer"
              />
              <label htmlFor="agreement" className="text-[13px] text-gray-400 font-light leading-relaxed cursor-pointer">
                I agree to the{' '}
                <a
                  href="/agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors duration-200"
                >
                  Enfora Task Commitment, Evidence Submission & Verification Agreement
                </a>
                .
              </label>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 md:flex-none px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !agreementAccepted}
                className="flex-1 md:flex-none px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showCustomRecurrence && (
        <CustomRecurrenceModal
          onClose={() => setShowCustomRecurrence(false)}
          onSave={handleCustomRecurrenceSave}
          initialRule={customRecurrenceRule}
        />
      )}

      {showPaymentRequired && (
        <PaymentMethodRequired
          onAddPayment={() => {
            setShowPaymentRequired(false);
            setShowAddPayment(true);
          }}
          onCancel={() => setShowPaymentRequired(false)}
        />
      )}

      {showAddPayment && (
        <AddPaymentMethodModal
          onClose={() => setShowAddPayment(false)}
          onSuccess={() => {
            setShowAddPayment(false);
            setHasPaymentMethod(true);
          }}
        />
      )}
    </div>
  );
}
