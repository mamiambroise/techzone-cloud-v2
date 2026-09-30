import React from 'react';
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

export function PageHeader({ title, subtitle, onRefresh, refreshing = false, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-60 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ArrowPathRoundedSquareIcon
              aria-hidden="true"
              className={`w-4 h-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
            />
            Rafraîchir
          </button>
        )}
      </div>
    </div>
  );
}
