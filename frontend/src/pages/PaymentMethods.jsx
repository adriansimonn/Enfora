import { useState, useEffect } from 'react';
import { getPaymentMethod, removePaymentMethod } from '../services/payment';
import AddPaymentMethodModal from '../components/AddPaymentMethodModal';
import Navigation from '../components/Navigation';

export default function PaymentMethods() {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPaymentMethod();
  }, []);

  const loadPaymentMethod = async () => {
    try {
      setLoading(true);
      const method = await getPaymentMethod();
      setPaymentMethod(method);
    } catch (error) {
      console.error('Failed to load payment method:', error);
      setError('Failed to load payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await removePaymentMethod();
      setPaymentMethod(null);
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      alert('Failed to remove payment method');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-28">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-light tracking-[-0.02em] leading-[1.1] mb-3">Payment Methods</h1>
          <p className="text-[15px] text-gray-400 font-light">Manage your payment methods for task stakes</p>
        </div>

        {/* Loading State */}
        {loading && (
          <p className="py-6 text-[15px] text-gray-500 font-light">Loading...</p>
        )}

        {/* Error State */}
        {error && !loading && (
          <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light">{error}</p>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {paymentMethod ? (
              <div className="border-t border-white/[0.15] pt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div>
                  <p className="text-[13px] text-gray-500 font-light mb-2">
                    Default payment method
                  </p>
                  <h3 className="text-2xl font-light tracking-[-0.01em] tabular-nums mb-1">
                    {paymentMethod.brand?.charAt(0).toUpperCase() + paymentMethod.brand?.slice(1)} &bull;&bull;&bull;&bull; {paymentMethod.last4}
                  </h3>
                  <p className="text-[13px] text-gray-400 font-light tabular-nums">
                    Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleRemove}
                    className="px-4 py-2 text-red-400 text-sm font-normal rounded-lg border border-red-400/30 hover:bg-red-400/[0.06] hover:border-red-400/50 transition-all duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-white/[0.15] pt-6">
                <h3 className="text-[16px] font-normal mb-1.5">No payment method on file</h3>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-6">
                  Add a payment method to create tasks with stake amounts
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  Add Payment Method
                </button>
              </div>
            )}

            {/* Security Notice */}
            <p className="mt-16 text-[13px] text-gray-500 font-light leading-relaxed">
              Your payment information is securely processed by{' '}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 underline underline-offset-4 decoration-white/20 hover:text-white hover:decoration-white/60 transition-colors duration-200"
              >
                Stripe
              </a>
              . We never store your full card details.
            </p>
          </>
        )}

        {/* Add Payment Method Modal */}
        {showAddModal && (
          <AddPaymentMethodModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              loadPaymentMethod();
            }}
          />
        )}
      </div>
    </div>
  );
}
