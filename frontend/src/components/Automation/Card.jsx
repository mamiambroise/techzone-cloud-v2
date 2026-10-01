import React from 'react';

export function CloseButton({ onClick, label = 'Fermer' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
    >
      {label}
    </button>
  );
}

export function Card({
  icon: Icon,
  gradient = 'from-blue-500 to-indigo-600',
  title,
  subtitle,
  meta,
  action,
  padded = true,
  className = '',
  children,
}) {
  return (
    <section className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
              <Icon aria-hidden="true" className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {(meta || action) && (
          <div className="flex items-center gap-3">
            {meta && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{meta}</span>}
            {action}
          </div>
        )}
      </div>
      {padded ? <div className="p-6">{children}</div> : children}
    </section>
  );
}
