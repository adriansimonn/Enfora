import { useState, useEffect } from 'react';
import { getPaymentHistory } from '../services/payment';
import Navigation from '../components/Navigation';

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { transactions: txns } = await getPaymentHistory();
      setTransactions(txns);
    } catch (error) {
      console.error('Failed to load payment history:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      succeeded: 'text-green-400 bg-green-500/10 border-green-500/50',
      pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50',
      failed: 'text-red-400 bg-red-500/10 border-red-500/50',
      canceled: 'text-gray-400 bg-gray-500/10 border-gray-500/50',
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-[-0.02em] mb-2">Payment History</h1>
          <p className="text-gray-400">View all your payment transactions</p>
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
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((txn) => (
                  <div
                    key={txn.transactionId}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-medium">
                            {formatAmount(txn.amount)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(txn.status)}`}>
                            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-1">
                          {formatDate(txn.createdAt)}
                        </p>

                        {txn.taskId && (
                          <p className="text-gray-500 text-xs">
                            Task ID: {txn.taskId.slice(0, 8)}...
                          </p>
                        )}

                        {txn.failureReason && (
                          <p className="text-red-400 text-sm mt-2">
                            {txn.failureReason}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {txn.status === 'succeeded' && (
                          <div className="text-green-400 text-sm">
                            ✓ Charged
                          </div>
                        )}
                        {txn.status === 'failed' && (
                          <div className="text-red-400 text-sm">
                            ✗ Failed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-medium mb-2">No transactions yet</h3>
                <p className="text-gray-400">
                  Your payment history will appear here when you have failed tasks with stakes
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
