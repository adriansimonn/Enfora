export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 text-white hover:bg-red-400",
  icon = null,
  isDestructive = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl p-6 max-w-md w-full">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div className={isDestructive ? 'text-red-400' : 'text-gray-400'}>
              {icon}
            </div>
          )}
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">
            {title}
          </h2>
        </div>
        <p className="text-[14px] text-gray-400 leading-relaxed font-light">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
