import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, Inbox, RotateCw } from "lucide-react";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] motion-reduce:transition-none";
export function WidgetBody({ widget, loading, retry, empty, children }) {
  if (loading || widget?.state === "LOADING")
    return (
      <div
        role="status"
        aria-label="Chargement"
        className="space-y-3 py-2 motion-safe:animate-pulse"
      >
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-4 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
      </div>
    );
  if (widget?.state === "FORBIDDEN")
    return <p className="py-4 text-sm text-slate-500">Accès non autorisé.</p>;
  if (!widget || ["ERROR", "UNAVAILABLE"].includes(widget.state))
    return (
      <div className="py-3 text-sm text-slate-500">
        <AlertCircle className="mb-2 h-5 w-5 text-slate-400" />
        <p>
          {widget?.state === "ERROR"
            ? "Données temporairement indisponibles."
            : "Cette source n’est pas encore disponible dans votre espace."}
        </p>
        {widget?.state === "ERROR" && (
          <button type="button" onClick={retry} className={`${buttonClass} mt-3`}>
            <RotateCw size={13} />
            Réessayer
          </button>
        )}
      </div>
    );
  if (widget?.state === "EMPTY")
    return (
      <div className="py-5 text-sm text-slate-500">
        <Inbox className="mb-2 h-5 w-5 text-slate-400" />
        {empty}
      </div>
    );
  return children(widget.data);
}
export function DashboardSection({ title, description, action, children, id, className = "" }) {
  return (
    <section
      aria-labelledby={id}
      className={`min-w-0 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-sm font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function ModuleCard({ group, entry, description }) {
  const Icon = group.Icon;
  return (
    <Link
      to={entry.route}
      className="group flex min-w-0 items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)] transition duration-200 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] motion-reduce:transition-none"
    >
      <span className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-[var(--color-text)]">{group.label}</span>
        {!entry.implemented ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
            Bientôt
          </span>
        ) : (
          <ArrowUpRight
            size={15}
            className="mt-0.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        )}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</span>
      </span>
    </Link>
  );
}
export function StatusBadge({ status }) {
  const danger = /CRITICAL|FAIL|ERROR|INVALID|BLOCK/.test(status);
  const warning = /WARNING|PENDING|DRAFT/.test(status);
  const success = /SUCCESS|ACTIVE|PUBLISHED|READY|RESOLVED/.test(status);
  const tone = danger
    ? "bg-[var(--color-error-soft)] text-[var(--color-error)]"
    : warning
      ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
      : success
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${tone}`}
    >
      {status}
    </span>
  );
}
export const displayDate = (value) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
