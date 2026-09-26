export function ErrorState({ message, onRetry }) {
  return (
    <div className="obs-error-state">
      <div className="obs-error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="obs-error-content">
        <div className="obs-error-title">Erreur</div>
        <div className="obs-error-message">{message || 'Une erreur est survenue.'}</div>
        {onRetry && <button type="button" className="obs-error-retry" onClick={onRetry}>Réessayer</button>}
      </div>
    </div>
  );
}
