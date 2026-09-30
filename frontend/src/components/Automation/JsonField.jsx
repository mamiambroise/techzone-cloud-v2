import React from 'react';
import { formatJson } from './utils.js';

export function JsonField({ id, label, value, onChange, rows = 5, error }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </label>
        <button
          type="button"
          onClick={() => onChange(formatJson(value))}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
        >
          Formater
        </button>
      </div>
      <textarea
        id={id}
        rows={rows}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 ${
          error ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
        }`}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
