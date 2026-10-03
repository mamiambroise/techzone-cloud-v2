import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Inbox, AlertTriangle, Ban, SearchX, Loader2, Hammer } from 'lucide-react';

/* ============================================================
   Business Manager — Design System partagé
   Canvas slate très clair, surfaces blanches, accent bleu
   Techzone, radius 10-12px, ombres discrètes, transitions
   150-180ms ease-out. Utilisé par les 7 écrans BM.
   ============================================================ */

// ---------- Layout ----------

export function BmPage({ children }) {
  return <div className="space-y-5">{children}</div>;
}

export function BmBreadcrumb({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />}
          {item.onClick || item.to ? (
            <Link
              to={item.to || '#'}
              onClick={item.onClick ? (event) => { event.preventDefault(); item.onClick(); } : undefined}
              className="rounded px-1 py-0.5 text-blue-700 hover:text-blue-800 hover:bg-blue-50 bm-focus"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-1 py-0.5 font-medium text-slate-700" aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function BmPageHeader({ title, subtitle, actions, children }) {
  return (
    <header className="space-y-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

// ---------- Context Bar (Application | Version | Statut | Environnement | Tenant) ----------

export function BmContextBar({ items }) {
  return (
    <section aria-label="Contexte de travail" className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <dl className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800">{item.value || 'Non sélectionné'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------- Cards ----------

export function BmCard({ title, subtitle, headerExtra, footer, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-2xs ${className}`}>
      {(title || headerExtra) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          {headerExtra && <div className="flex shrink-0 items-center gap-2">{headerExtra}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{footer}</div>}
    </section>
  );
}

export function BmKpiCard({ label, value, hint, icon, tone = 'blue', loading = false }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bm-hover-lift flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      {icon && (
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{label}</p>
        {loading ? (
          <div className="skeleton mt-1 h-8 w-14" aria-label="Chargement" />
        ) : (
          <p className="text-3xl font-bold leading-none text-slate-900">{value ?? '—'}</p>
        )}
        {hint && !loading && <p className="mt-1.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

// ---------- Toolbar ----------

export function BmToolbar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
      {children}
    </div>
  );
}

export function BmSearchInput({ value, onChange, placeholder = 'Rechercher…', label = 'Rechercher' }) {
  return (
    <input
      type="search"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 bm-focus focus:border-blue-400 sm:max-w-xs"
    />
  );
}

export function BmSelect({ label, value, onChange, options, className = '' }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 bm-focus ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

// ---------- Tabs (underline, animation 150ms) ----------

export function BmTabs({ tabs, active, onChange, ariaLabel = 'Onglets' }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const id = tab.id ?? tab;
        const label = tab.label ?? tab;
        const isActive = id === active;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => {
              if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
              event.preventDefault();
              const buttons = [...event.currentTarget.parentElement.querySelectorAll('[role="tab"]')];
              const index = buttons.indexOf(event.currentTarget);
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
              buttons[next]?.focus(); buttons[next]?.click();
            }}
            onClick={() => onChange(id)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 bm-focus ${
              isActive
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Table ----------

export function BmTable({ columns, rows, keyOf = (row) => row.id, emptyState, footer }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${column.className || ''}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={keyOf(row, index)} className="transition-colors duration-150 hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 align-middle text-slate-700 ${column.className || ''}`}>
                    {column.render ? column.render(row, index) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && emptyState}
      </div>
      {footer && rows.length > 0 && <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{footer}</div>}
    </div>
  );
}

// ---------- Badges ----------

const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

export function BmBadge({ children, tone = 'neutral', dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_TONES[tone] || BADGE_TONES.neutral}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  // Application
  ACTIVE: 'green',
  PUBLISHED: 'green',
  RESOLVED: 'green',
  VALID: 'green',
  COMPLETED: 'green',
  UP: 'green',
  OUTDATED: 'amber',
  INVALID: 'red',
  DOWN: 'red',
  INACTIVE: 'neutral',
  ARCHIVED: 'neutral',
  DISABLED: 'red',
  // Version / entité / feature / capability / menu
  DRAFT: 'amber',
  CONFIGURING: 'blue',
  VALIDATING: 'violet',
  READY: 'blue',
  SUPERSEDED: 'neutral',
  DEPRECATED: 'neutral',
  // Statuts génériques
  ACTIVE_: 'green',
  WARNING: 'amber',
  ERROR: 'red',
  BLOCKED: 'red',
  FAIL: 'red',
  PASS: 'green',
  PASS_WITH_WARNINGS: 'amber',
  NOT_EVALUATED: 'neutral',
  VISIBLE: 'green',
  HIDDEN: 'neutral',
  DISABLED_: 'red',
};

export function BmStatusBadge({ value }) {
  if (!value) return <BmBadge tone="neutral">—</BmBadge>;
  const tone = STATUS_TONES[value] ?? 'neutral';
  const label = value === 'ACTIVE_' ? 'Active' : value.replaceAll('_', ' ');
  return <BmBadge tone={tone} dot>{label}</BmBadge>;
}

// ---------- Boutons / actions ----------

export function BmButton({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:bg-blue-300',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
    danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:text-rose-300',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-not-allowed bm-focus ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

export function BmIconButton({ label, onClick, children, variant = 'ghost', disabled = false }) {
  const variants = {
    ghost: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    danger: 'text-slate-400 hover:bg-rose-50 hover:text-rose-600',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors duration-150 bm-focus disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// ---------- Empty / Error / Loading / Planned states ----------

export function BmEmptyState({ icon, title, description, action }) {
  const Icon = icon || Inbox;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function BmSearchEmptyState({ query, onReset }) {
  return (
    <BmEmptyState
      icon={SearchX}
      title="Aucun résultat"
      description={<>Aucun élément ne correspond à « <strong>{query}</strong> ».</>}
      action={<BmButton variant="secondary" size="sm" onClick={onReset}>Réinitialiser la recherche</BmButton>}
    />
  );
}

export function BmErrorState({ onRetry, message }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500" aria-hidden="true">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-rose-800">{message || 'Opération impossible.'}</p>
      <p className="max-w-md text-xs text-rose-600/90">
        Vérifiez les valeurs, vos droits et la disponibilité du service, puis réessayez.
      </p>
      {onRetry && <BmButton variant="secondary" size="sm" onClick={onRetry} className="mt-1">Réessayer</BmButton>}
    </div>
  );
}

export function BmForbiddenState() {
  return (
    <BmEmptyState
      icon={Ban}
      title="Accès refusé"
      description="Votre rôle ne permet pas d'accéder à cette ressource ou à cette action."
    />
  );
}

export function BmPlannedState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500" aria-hidden="true">
        <Hammer className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-md text-xs text-slate-500">{description}</p>}
      <BmBadge tone="blue">Planned</BmBadge>
    </div>
  );
}

export function BmLoading({ label = 'Chargement…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none text-blue-500" aria-hidden="true" />
      {label}
    </div>
  );
}

export function BmSkeletonRows({ rows = 4 }) {
  return (
    <div className="space-y-2 p-1" aria-busy="true" aria-label="Chargement du contenu">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-10 w-full" />
      ))}
    </div>
  );
}

// ---------- Helper : messages d'erreur sûrs (jamais de stack brute) ----------

export const bmSafeError = 'Opération impossible. Vérifiez les valeurs, vos droits et la disponibilité du service, puis réessayez.';
