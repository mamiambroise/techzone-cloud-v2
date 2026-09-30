import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';

const SUMMARY = [
  ['executionId', 'Exécution'],
  ['traceId', 'Trace ID'],
  ['durationMs', 'Durée'],
];

export function JsonResult({ data, maxHeight = 'max-h-72', className = 'mt-4' }) {
  if (data === null || data === undefined) return null;

  if (data.error) {
    return (
      <p role="alert" className={`${className} rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300`}>
        {data.error}
      </p>
    );
  }

  const isObject = typeof data === 'object' && !Array.isArray(data);
  const chips = isObject ? SUMMARY.filter(([key]) => data[key] !== undefined && data[key] !== null) : [];
  const hasStatus = isObject && data.status !== undefined && data.status !== null;
  const hasSummary = hasStatus || chips.length > 0;

  const pre = (
    <pre className={`bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto ${maxHeight}`}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className={className}>
      {hasSummary && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          {hasStatus && <StatusBadge status={data.status} />}
          {chips.map(([key, label]) => (
            <span key={key}>
              {label} :{' '}
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {key === 'durationMs' ? `${data[key]} ms` : String(data[key])}
              </span>
            </span>
          ))}
        </div>
      )}
      {hasSummary ? (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">JSON brut</summary>
          {pre}
        </details>
      ) : (
        pre
      )}
    </div>
  );
}
