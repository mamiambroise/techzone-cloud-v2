import React from 'react';

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52 sm:w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/60">
        <Skeleton className="h-5 w-40" />
        <div className="ml-auto">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32 sm:w-48" />
            <Skeleton className={`h-4 rounded-full ${i % 3 === 0 ? 'w-20' : 'w-24'}`} />
            <Skeleton className="h-4 w-20 ml-auto hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModernSpinner({ label = 'Chargement...' }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-8 text-slate-500 dark:text-slate-400"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#5469D4] border-r-[#5469D4]/40 animate-spin" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
