// components/ConfirmationModal.js
"use client";

// Props:
// - isOpen: boolean
// - onClose: function to close the modal (called on cancel or overlay click)
// - onConfirm: function to call when user confirms
// - title: string, e.g., "Confirm Deletion"
// - message: string, e.g., "Are you sure you want to delete this journal entry?"
// - confirmText: string, e.g., "Delete" (defaults to "Confirm")
// - cancelText: string, e.g., "Cancel"
// - confirmButtonClass: string, e.g., "bg-red-600 hover:bg-red-700"
// - isProcessing: boolean, to disable buttons during action

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-600 hover:bg-red-700", // Default for destructive actions
  isProcessing = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id="confirmation-modal-title"
            className="text-xl font-semibold text-gray-800"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmButtonClass} focus:ring-${
              confirmButtonClass.split("-")[1]
            }-500`} // Basic focus ring color based on bg
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
