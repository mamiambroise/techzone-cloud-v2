import { ChevronLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="pb-1">
      {breadcrumb && (
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1.5">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-1">/</span>}
              {crumb.onClick ? (
                <button type="button" onClick={crumb.onClick} className="hover:text-[var(--color-text)]">{crumb.label}</button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-1.5">{subtitle}</p>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="shrink-0 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-lg)] hover:bg-[var(--color-primary-hover)] transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function BackLink({ onClick, label = 'Retour' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4"
    >
      <ChevronLeft size={16} className="mr-1" />
      {label}
    </button>
  );
}
