export function Card({ title, description, footer, children, action, onClick, className = '' }) {
  const onKeyDown = (event) => {
    if (!onClick || event.currentTarget !== event.target || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    onClick(event);
  };

  return (
    <div
      className={`bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-card)] ${onClick ? 'tz-surface-interactive cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {title && <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>}
      {description && <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
      {footer && <div className="mt-3 text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-2">{footer}</div>}
      {action && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            action.onClick(event);
          }}
          className="mt-3 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
