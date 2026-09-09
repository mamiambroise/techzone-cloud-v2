import { useEffect } from 'react';

export function ConfirmationModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false }) {
  if (!open) return null;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="obs-modal-backdrop" onClick={onCancel}>
      <div className="obs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="obs-modal-header">
          <h3 className="obs-modal-title">{title}</h3>
          <button type="button" className="obs-modal-close" onClick={onCancel} aria-label="Fermer">×</button>
        </div>
        <div className="obs-modal-body">
          <p>{message}</p>
        </div>
        <div className="obs-modal-actions">
          <button type="button" className="obs-modal-btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`obs-modal-btn-danger ${danger ? '' : 'obs-modal-btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
