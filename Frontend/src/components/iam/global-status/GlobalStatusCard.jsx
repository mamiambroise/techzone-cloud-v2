// GlobalStatusCard.jsx — Reusable Base Card with Dynamic Status-Based Coloring
// Implements IAM-CDC-01 Section 10 specification for Health, Security Posture, Readiness & Context Integrity

import React from 'react';
import { resolveStatusTheme } from '../../../types/iamDomain';
import { ChevronRight, ArrowUpRight, HelpCircle } from 'lucide-react';

/**
 * Reusable Global Status Card Component
 */
export function GlobalStatusCard({
  title,
  question,
  status,
  category = 'health',
  score,
  scoreUnit = '%',
  scoreLabel = 'Score Global',
  scoreSubtext,
  icon: Icon,
  badgeText,
  metrics = [],
  progressItems = [],
  summaryText,
  footerMeta,
  onInspect,
  inspectLabel = 'Inspecter',
  className = '',
  children,
}) {
  // Dynamically resolve theme color palette from current status and category
  const theme = resolveStatusTheme(status, category);

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white border ${theme.border} shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group ${className}`}
    >
      {/* Dynamic Status-Based Top Color Accent Bar */}
      <div className={`h-1.5 w-full ${theme.topBar} transition-colors duration-300`} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Header: Title, Icon & Status Badge */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {Icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${theme.iconBg} flex-shrink-0 transition-colors shadow-2xs`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                {question && (
                  <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic mt-0.5" title={question}>
                    {question}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide uppercase border flex-shrink-0 shadow-2xs transition-all ${theme.badgeBg}`}
            >
              <span className={`w-2 h-2 rounded-full ${theme.dotBg} animate-pulse`} />
              <span>{badgeText || status}</span>
            </span>
          </div>

          {/* Primary Score / Level Display & Progress Gauge */}
          {score !== undefined && score !== null && (
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {scoreLabel}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.scoreText}`}>
                    {score}
                  </span>
                  {scoreUnit && (
                    <span className="text-xs font-bold text-slate-400">{scoreUnit}</span>
                  )}
                </div>
              </div>

              {scoreSubtext && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                    {scoreSubtext}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Progress / Breakdown Bars (if provided) */}
          {progressItems && progressItems.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                {progressItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`h-full rounded-full transition-all ${item.color || theme.meterBg}`}
                    style={{ width: `${item.pct || 0}%` }}
                    title={`${item.label}: ${item.count} (${item.pct}%)`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Secondary Detailed Metrics List */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col justify-between"
              >
                <span className="text-[10px] font-bold text-slate-500 truncate block">
                  {m.label}
                </span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs font-black text-slate-800">
                    {m.value}
                  </span>
                  {m.subtext && (
                    <span className={`text-[10px] font-semibold ${m.statusColor || 'text-slate-400'}`}>
                      {m.subtext}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Body Slot */}
        {children}

        {/* Summary Description */}
        {summaryText && (
          <div className="pt-2 text-[11px] text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50">
            {summaryText}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata & Drill-down Action Button */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400 truncate">
          {footerMeta || 'Surveillance active'}
        </span>

        {onInspect && (
          <button
            onClick={onInspect}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            <span>{inspectLabel}</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

export default GlobalStatusCard;
