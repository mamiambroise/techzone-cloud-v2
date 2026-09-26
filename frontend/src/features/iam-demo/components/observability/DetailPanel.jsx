export function DetailPanel({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="obs-detail-backdrop" onClick={onClose}>
      <div className="obs-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="obs-detail-header">
          <h3 className="obs-detail-title">{title}</h3>
          <button type="button" className="obs-detail-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="obs-detail-body">{children}</div>
      </div>
    </div>
  );
}
