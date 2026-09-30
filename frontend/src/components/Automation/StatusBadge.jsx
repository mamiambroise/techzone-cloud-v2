import React from 'react';
import { getStatusMeta } from './statusConfig.js';

const TONES = {
  green: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  red: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' },
  amber: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
  blue: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500' },
  violet: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', dot: 'bg-violet-500' },
  slate: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
};

export function StatusBadge({ status, catalog }) {
  const meta = getStatusMeta(status, catalog);
  const tone = TONES[meta.tone] || TONES.slate;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${tone.badge}`}>
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {meta.label}
    </span>
  );
}
