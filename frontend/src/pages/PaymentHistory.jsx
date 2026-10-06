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
      succeeded: 'bg-green-400',
      pending: 'bg-yellow-400',
      failed: 'bg-red-400',
      canceled: 'bg-gray-500',
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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-28">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-light tracking-[-0.02em] leading-[1.1] mb-3">Payment History</h1>
          <p className="text-[15px] text-gray-400 font-light">View all your payment transactions</p>
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
            {transactions.length > 0 ? (
              <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {transactions.map((txn) => (
                  <div
                    key={txn.transactionId}
                    className="flex items-start justify-between gap-6 py-5"
                  >
                    <div className="min-w-0">
                      {txn.taskTitle && (
                        <p className="text-[15px] text-white font-normal truncate mb-1">
                          {txn.taskTitle}
                        </p>
                      )}

                      <p className="text-[13px] text-gray-500 font-light">
                        {formatDate(txn.createdAt)}
                      </p>

                      {txn.failureReason && (
                        <p className="text-[13px] text-red-400 font-light mt-2">
                          {txn.failureReason}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-xl font-light tabular-nums tracking-[-0.01em] mb-1">
                        {formatAmount(txn.amount)}
                      </p>
                      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(txn.status)}`} />
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-t border-white/[0.15] pt-6">
                <h3 className="text-[16px] font-normal mb-1.5">No transactions yet</h3>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed">
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
