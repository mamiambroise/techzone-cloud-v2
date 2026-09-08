import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function ConfirmModal({
  open,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4"
      style={{ background: 'rgba(11, 19, 43, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 toast-enter"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              danger
                ? 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
            }`}
          >
            {danger ? (
              <ExclamationTriangleIcon className="w-7 h-7" />
            ) : (
              <InformationCircleIcon className="w-7 h-7" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {message && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-md ${
              danger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                : 'bg-[#5469D4] hover:bg-[#4A5EC7] shadow-[#5469D4]/30'
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}