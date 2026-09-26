export function EmptyState({ title, description, action }) {
  return (
    <div className="obs-empty-state">
      <div className="obs-empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="obs-empty-content">
        <div className="obs-empty-title">{title}</div>
        {description && <div className="obs-empty-desc">{description}</div>}
        {action && <div className="obs-empty-action">{action}</div>}
      </div>
    </div>
  );
}
