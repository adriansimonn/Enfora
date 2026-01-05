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

  const getCardBrandIcon = (brand) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
    };
    return icons[brand?.toLowerCase()] || '💳';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-[-0.02em] mb-2">Payment Methods</h1>
          <p className="text-gray-400">Manage your payment methods for task stakes</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {paymentMethod ? (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getCardBrandIcon(paymentMethod.brand)}</div>
                    <div>
                      <h3 className="text-xl font-medium mb-1">
                        {paymentMethod.brand?.charAt(0).toUpperCase() + paymentMethod.brand?.slice(1)} •••• {paymentMethod.last4}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        Default payment method
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-white text-sm font-medium rounded-lg transition-all border border-white/[0.08]"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleRemove}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-all border border-red-500/50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-medium mb-2">No payment method on file</h3>
                <p className="text-gray-400 mb-6">
                  Add a payment method to create tasks with stake amounts
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all inline-block"
                >
                  Add Payment Method
                </button>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
              <p className="text-gray-400 text-sm text-center">
                <span className="font-medium text-white">Your payment information is securely processed by <a href="https://stripe.com" target="_blank">Stripe</a>. We never store your full card details.</span>
              </p>
            </div>
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
