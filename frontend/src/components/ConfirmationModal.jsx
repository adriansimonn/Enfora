export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700",
  icon = null,
  isDestructive = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl p-6 max-w-md w-full">
        {/* Icon and Title */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className={`${isDestructive ? 'text-red-400' : 'text-blue-400'}`}>
                {icon}
              </div>
            )}
            <h2 className={`text-2xl font-light tracking-[-0.01em] ${isDestructive ? 'text-red-400' : 'text-white'}`}>
              {title}
            </h2>
          </div>
          <p className="text-gray-300 leading-relaxed font-light">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white font-medium rounded-xl transition-all duration-200 border border-white/[0.08] hover:border-white/[0.12]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-all duration-200 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
