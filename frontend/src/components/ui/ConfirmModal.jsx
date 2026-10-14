import React, { useEffect, useRef } from 'react';
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
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4"
      style={{ background: 'rgba(11, 19, 43, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-2xl border border-[var(--color-border)] p-6 toast-enter"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={message ? 'confirm-modal-message' : undefined}
        tabIndex={-1}
      >
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              danger
                ? 'bg-red-100 text-red-500'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {danger ? (
              <ExclamationTriangleIcon className="w-7 h-7" />
            ) : (
              <InformationCircleIcon className="w-7 h-7" />
            )}
          </div>
          <div className="min-w-0">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-[var(--color-text)]">{title}</h3>
            {message && <p id="confirm-modal-message" className="mt-1 text-sm text-[var(--color-text-muted)] leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium text-[var(--color-text-muted)] bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold text-white transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-md ${
              danger
                ? 'bg-[var(--color-error)] hover:bg-red-600 shadow-red-600/30'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-[var(--color-primary)]/30'
            } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
