// iamDomain.js — Constants, Enums & Configurations for IAM, Auth & Context (IAM-CDC-01 Section 10)

/**
 * 10.1 Platform Health Statuses
 */
export const IAM_HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',     // 95-100% — All core services operational
  WARNING: 'WARNING',     // 80-94%  — Minor latency or non-blocking warning
  DEGRADED: 'DEGRADED',   // 60-79%  — One or more non-critical services degraded
  CRITICAL: 'CRITICAL',   // <60%    — Core IAM auth/token engine failing
  UNKNOWN: 'UNKNOWN',     // State cannot be verified
};

/**
 * 10.2 Security Posture Statuses
 */
export const IAM_SECURITY_POSTURE = {
  SECURE: 'SECURE',       // Level 0 — No threat detected, 100% compliance
  MONITORED: 'MONITORED', // Level 1 — Nominal traffic with routine login alerts
  WARNING: 'WARNING',     // Level 2 — Multiple failed logins or missing 2FA on admin
  HIGH_RISK: 'HIGH_RISK', // Level 3 — Brute-force attacks or suspicious tokens
  CRITICAL: 'CRITICAL',   // Level 4 — Active security breach or credential stuffing
};

/**
 * 10.3 IAM Readiness Statuses
 */
export const IAM_READINESS_STATUS = {
  OPTIMAL: 'OPTIMAL',             // 90-100% — Fully configured and validated
  READY: 'READY',                 // 75-89%  — Production ready with minor non-blocking items
  INCOMPLETE: 'INCOMPLETE',       // 50-74%  — Missing role bindings or unlinked ERP accounts
  CRITICAL_GAPS: 'CRITICAL_GAPS', // <50%    — Missing tenant isolation or empty role mappings
};

/**
 * 10.4 Context Integrity Statuses
 */
export const IAM_CONTEXT_INTEGRITY_STATUS = {
  VERIFIED: 'VERIFIED', // 100% — All contexts uniquely resolved with zero conflict
  HEALTHY: 'HEALTHY',   // 95-99% — Nominal resolution with isolated transient retries
  PARTIAL: 'PARTIAL',   // 80-94% — Some optional context attributes unresolved
  CONFLICT: 'CONFLICT', // Context attribute collision detected (e.g. dual tenant)
  INVALID: 'INVALID',   // Malformed context payload
  STALE: 'STALE',       // Expired context cache
};

/**
 * Visual Color Themes & Styling configuration for dynamic status-based cards
 */
export const STATUS_THEME_CONFIG = {
  // Positive / Healthy / Secure
  emerald: {
    name: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotBg: 'bg-emerald-500',
    border: 'border-emerald-200/80 hover:border-emerald-300',
    topBar: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
    scoreText: 'text-emerald-700',
    meterBg: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/10',
    subtleBg: 'bg-emerald-50/40',
    accentText: 'text-emerald-600',
  },
  // Nominal / Monitored / Ready
  blue: {
    name: 'blue',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    dotBg: 'bg-blue-500',
    border: 'border-blue-200/80 hover:border-blue-300',
    topBar: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/70',
    scoreText: 'text-blue-700',
    meterBg: 'bg-blue-500',
    glowColor: 'shadow-blue-500/10',
    subtleBg: 'bg-blue-50/40',
    accentText: 'text-blue-600',
  },
  // Cyan / Teal for Optimal & High Precision
  teal: {
    name: 'teal',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    dotBg: 'bg-teal-500',
    border: 'border-teal-200/80 hover:border-teal-300',
    topBar: 'bg-teal-500',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200/70',
    scoreText: 'text-teal-700',
    meterBg: 'bg-teal-500',
    glowColor: 'shadow-teal-500/10',
    subtleBg: 'bg-teal-50/40',
    accentText: 'text-teal-600',
  },
  // Warning / Incomplete / Monitored risk
  amber: {
    name: 'amber',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotBg: 'bg-amber-500',
    border: 'border-amber-200/80 hover:border-amber-300',
    topBar: 'bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/70',
    scoreText: 'text-amber-700',
    meterBg: 'bg-amber-500',
    glowColor: 'shadow-amber-500/10',
    subtleBg: 'bg-amber-50/40',
    accentText: 'text-amber-600',
  },
  // Degraded / High Risk
  orange: {
    name: 'orange',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    dotBg: 'bg-orange-500',
    border: 'border-orange-200/80 hover:border-orange-300',
    topBar: 'bg-orange-500',
    iconBg: 'bg-orange-50 text-orange-600 border-orange-200/70',
    scoreText: 'text-orange-700',
    meterBg: 'bg-orange-500',
    glowColor: 'shadow-orange-500/10',
    subtleBg: 'bg-orange-50/40',
    accentText: 'text-orange-600',
  },
  // Critical / Breach / Invalid
  rose: {
    name: 'rose',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dotBg: 'bg-rose-500',
    border: 'border-rose-200/80 hover:border-rose-300',
    topBar: 'bg-rose-500',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200/70',
    scoreText: 'text-rose-700',
    meterBg: 'bg-rose-500',
    glowColor: 'shadow-rose-500/10',
    subtleBg: 'bg-rose-50/40',
    accentText: 'text-rose-600',
  },
  // Neutral / Unknown / Inactive
  slate: {
    name: 'slate',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700',
    dotBg: 'bg-slate-400',
    border: 'border-slate-200 hover:border-slate-300',
    topBar: 'bg-slate-400',
    iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
    scoreText: 'text-slate-700',
    meterBg: 'bg-slate-400',
    glowColor: 'shadow-slate-500/5',
    subtleBg: 'bg-slate-50/50',
    accentText: 'text-slate-600',
  },
};

/**
 * Helper to resolve dynamic color theme key from status value
 */
export function resolveStatusTheme(status, category = 'health') {
  const norm = (status || '').toUpperCase();

  // Health mappings
  if (category === 'health') {
    switch (norm) {
      case 'HEALTHY':
        return STATUS_THEME_CONFIG.emerald;
      case 'WARNING':
        return STATUS_THEME_CONFIG.amber;
      case 'DEGRADED':
        return STATUS_THEME_CONFIG.orange;
      case 'CRITICAL':
        return STATUS_THEME_CONFIG.rose;
      default:
        return STATUS_THEME_CONFIG.slate;
    }
  }

  // Security Posture mappings
  if (category === 'security') {
    switch (norm) {
      case 'SECURE':
        return STATUS_THEME_CONFIG.emerald;
      case 'MONITORED':
        return STATUS_THEME_CONFIG.blue;
      case 'WARNING':
        return STATUS_THEME_CONFIG.amber;
      case 'HIGH_RISK':
        return STATUS_THEME_CONFIG.orange;
      case 'CRITICAL':
        return STATUS_THEME_CONFIG.rose;
      default:
        return STATUS_THEME_CONFIG.slate;
    }
  }

  // Readiness mappings
  if (category === 'readiness') {
    switch (norm) {
      case 'OPTIMAL':
        return STATUS_THEME_CONFIG.emerald;
      case 'READY':
        return STATUS_THEME_CONFIG.teal;
      case 'INCOMPLETE':
        return STATUS_THEME_CONFIG.amber;
      case 'CRITICAL_GAPS':
        return STATUS_THEME_CONFIG.rose;
      default:
        return STATUS_THEME_CONFIG.slate;
    }
  }

  // Context Integrity mappings
  if (category === 'context') {
    switch (norm) {
      case 'VERIFIED':
        return STATUS_THEME_CONFIG.emerald;
      case 'HEALTHY':
        return STATUS_THEME_CONFIG.teal;
      case 'PARTIAL':
        return STATUS_THEME_CONFIG.amber;
      case 'CONFLICT':
        return STATUS_THEME_CONFIG.orange;
      case 'INVALID':
        return STATUS_THEME_CONFIG.rose;
      case 'STALE':
        return STATUS_THEME_CONFIG.slate;
      default:
        return STATUS_THEME_CONFIG.slate;
    }
  }

  return STATUS_THEME_CONFIG.slate;
}
