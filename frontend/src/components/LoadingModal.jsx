export default function LoadingModal({ message, stage }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-zinc-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>

          {/* Message */}
          <h3 className="text-xl font-semibold text-white mb-2 text-center">
            {message || 'Processing...'}
          </h3>

          {/* Stage indicator */}
          {stage && (
            <p className="text-sm text-gray-400 font-light text-center">
              {stage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
