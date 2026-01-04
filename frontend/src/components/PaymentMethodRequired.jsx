export default function PaymentMethodRequired({ onAddPayment, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-2xl font-light text-white tracking-[-0.01em]">Payment Method Required</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-all duration-200 p-1.5 hover:bg-white/[0.06] rounded-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 leading-relaxed">
            To create tasks with stake amounts, you need to add a payment method to your account.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your card will only be charged if you fail to complete a task before its deadline.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddPayment}
            className="flex-1 px-4 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all"
          >
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
