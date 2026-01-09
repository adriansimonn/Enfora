import { useState, useEffect } from 'react';
import CustomRecurrenceModal from './CustomRecurrenceModal';
import PaymentMethodRequired from './PaymentMethodRequired';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import { getPaymentMethod } from '../services/payment';

export default function CreateTaskModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
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
  const [agreementViewed, setAgreementViewed] = useState(false);
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

  const handleAgreementLinkClick = () => {
    setAgreementViewed(true);
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
      // datetime-local gives us a string like "2024-01-09T14:00" which is interpreted as local time
      // We need to convert it to ISO format with timezone info
      const deadlineDate = new Date(deadline);
      const deadlineISO = deadlineDate.toISOString();

      await onSubmit({
        title,
        description,
        deadline: deadlineISO,
        stakeAmount: parseFloat(stakeAmount),
        recurrenceRule,
        isRecurring: recurrenceRule !== null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-2xl font-light text-white tracking-[-0.01em]">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-1.5 hover:bg-white/[0.06] rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-normal text-white mb-2">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 font-light focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] focus:border-transparent transition-all"
              placeholder="Enter a clear task title..."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-normal text-white mb-2">
              Task Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 font-light focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] focus:border-transparent transition-all"
              placeholder="Describe the task you want to complete..."
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-normal text-white mb-2">
              Deadline
            </label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] focus:border-transparent transition-all [color-scheme:dark]"
            />
          </div>

          <div>
            <label htmlFor="stakeAmount" className="block text-sm font-normal text-white mb-2">
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
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 font-light focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] focus:border-transparent transition-all"
              placeholder="0.00"
            />
            <p className="text-gray-500 text-xs mt-2">
              If you fail to complete this task, you'll be charged this amount.
            </p>
          </div>

          <div>
            <label htmlFor="recurrence" className="block text-sm font-normal text-white mb-2">
              Recurrence
            </label>
            <select
              id="recurrence"
              value={recurrenceType}
              onChange={(e) => handleRecurrenceChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] focus:border-transparent transition-all"
            >
              <option value="does-not-repeat">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">
                Weekly on {deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'long' }) : '...'}
              </option>
              <option value="weekdays">Every weekday (Monday to Friday)</option>
              <option value="custom">Custom...</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <input
              type="checkbox"
              id="agreement"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              disabled={!agreementViewed}
              className="mt-1 w-4 h-4 rounded border-white/[0.2] bg-white/[0.03] text-white focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="agreement" className="text-sm text-gray-300 leading-relaxed">
              I agree to the{' '}
              <a
                href="/agreement"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAgreementLinkClick}
                className="text-white underline hover:text-gray-200 transition-colors"
              >
                Enfora Task Commitment, Evidence Submission & Verification Agreement
              </a>
              .
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !agreementAccepted}
              className="flex-1 px-4 py-3 bg-white disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-500 font-medium rounded-xl"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
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
