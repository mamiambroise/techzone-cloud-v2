import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, Inbox, RotateCw } from "lucide-react";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 motion-reduce:transition-none";
export function WidgetBody({ widget, loading, retry, empty, children }) {
  if (loading || !widget || widget.state === "LOADING")
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
  if (widget.state === "FORBIDDEN")
    return <p className="py-4 text-sm text-slate-500">Accès non autorisé.</p>;
  if (["ERROR", "UNAVAILABLE"].includes(widget.state))
    return (
      <div className="py-3 text-sm text-slate-500">
        <AlertCircle className="mb-2 h-5 w-5 text-slate-400" />
        <p>
          {widget.state === "ERROR"
            ? "Données temporairement indisponibles."
            : "Cette source n’est pas encore disponible dans votre espace."}
        </p>
        {widget.state === "ERROR" && (
          <button onClick={retry} className={`${buttonClass} mt-3`}>
            <RotateCw size={13} />
            Réessayer
          </button>
        )}
      </div>
    );
  if (widget.state === "EMPTY")
    return (
      <div className="py-5 text-sm text-slate-500">
        <Inbox className="mb-2 h-5 w-5 text-slate-400" />
        {empty}
      </div>
    );
  return children(widget.data);
}
export function DashboardSection({ title, description, action, children, id }) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={id} className="text-sm font-semibold text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
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
      className="group flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-slate-50 p-2 text-blue-600">
          <Icon size={20} />
        </span>
        {!entry.implemented ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
            Bientôt
          </span>
        ) : (
          <ArrowUpRight
            size={17}
            className="text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        )}
      </div>
      <h3 className="mt-3 text-sm font-semibold">{group.label}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </Link>
  );
}
export function StatusBadge({ status }) {
  const danger = /FAIL|ERROR|INVALID|BLOCK/.test(status);
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${danger ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}
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
