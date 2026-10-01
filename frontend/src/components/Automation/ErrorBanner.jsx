import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/60 rounded-xl p-4 flex items-center gap-3">
      <XCircleIcon aria-hidden="true" className="w-5 h-5 text-red-500 shrink-0" />
      <p className="flex-1 text-red-700 dark:text-red-300 font-medium text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-red-700 dark:text-red-300 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-red-600 rounded"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
