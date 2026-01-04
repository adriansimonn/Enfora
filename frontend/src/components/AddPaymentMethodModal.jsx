import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createSetupIntent, savePaymentMethod } from '../services/payment';

// Initialize Stripe outside component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Card Element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#f87171',
      iconColor: '#f87171',
    },
  },
};

// Inner component with Stripe hooks
function PaymentForm({ onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create SetupIntent
      const { clientSecret } = await createSetupIntent();

      // 2. Confirm card setup
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // 3. Save payment method to backend
      await savePaymentMethod(setupIntent.payment_method);

      // 4. Success callback
      onSuccess();
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add payment method');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-normal text-white mb-2">
          Card Information
        </label>
        <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-3 bg-white disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-gray-500 font-medium rounded-xl transition-all"
        >
          {loading ? 'Adding...' : 'Add Card'}
        </button>
      </div>
    </form>
  );
}

// Wrapper component with Elements provider
export default function AddPaymentMethodModal({ onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-2xl font-light text-white tracking-[-0.01em]">Add Payment Method</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-1.5 hover:bg-white/[0.06] rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form with Stripe Elements */}
        <Elements stripe={stripePromise}>
          <PaymentForm onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}
