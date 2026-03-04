export function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
