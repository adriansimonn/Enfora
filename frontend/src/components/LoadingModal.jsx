export default function LoadingModal({ message, stage }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl p-8 max-w-sm w-full">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="w-8 h-8 mb-6 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>

          {/* Message */}
          <h3 className="text-xl font-light text-white mb-2 text-center tracking-[-0.01em]">
            {message || 'Processing...'}
          </h3>

          {/* Stage indicator */}
          {stage && (
            <p className="text-[13px] text-gray-400 font-light text-center">
              {stage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
