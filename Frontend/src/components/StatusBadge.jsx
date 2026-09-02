// StatusBadge.jsx — Lifecycle Status Indicator Badge (BM-CDC-00 / BM-CDC-01 / BM-CDC-02)
import React from 'react';
import {
  APPLICATION_STATUS,
  VERSION_STATUS,
  ENVIRONMENTS,
  VALIDATION_SEVERITY,
} from '../types/domain';

/**
 * Status mapping definitions for Application and Version lifecycles.
 * Green for PUBLISHED, blue for DRAFT, vibrant green for ACTIVE, etc.
 */
export const STATUS_CONFIG = {
  // Published Versions (Strictly Green)
  [VERSION_STATUS?.PUBLISHED || 'PUBLISHED']: {
    label: 'PUBLISHED',
    display: 'Publiée',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 text-white border-emerald-600',
    pulse: false,
    colorName: 'green',
  },
  'PUBLIÉ': {
    label: 'PUBLIÉ',
    display: 'Publiée',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 text-white border-emerald-600',
    pulse: false,
    colorName: 'green',
  },

  // Draft Versions & Apps (Strictly Blue)
  [VERSION_STATUS?.DRAFT || 'DRAFT']: {
    label: 'DRAFT',
    display: 'Brouillon',
    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
    solidBg: 'bg-blue-600 text-white border-blue-600',
    pulse: false,
    colorName: 'blue',
  },
  'BROUILLON': {
    label: 'BROUILLON',
    display: 'Brouillon',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    solidBg: 'bg-blue-600 text-white border-blue-600',
    pulse: false,
    colorName: 'blue',
  },

  // Active Applications (Green with pulse)
  [APPLICATION_STATUS?.ACTIVE || 'ACTIVE']: {
    label: 'ACTIVE',
    display: 'Actif',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 text-white border-emerald-600',
    pulse: true,
    colorName: 'emerald',
  },
  'ACTIF': {
    label: 'ACTIF',
    display: 'Actif',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    dot: 'bg-emerald-500',
    solidBg: 'bg-emerald-600 text-white border-emerald-600',
    pulse: true,
    colorName: 'emerald',
  },

  // Configuring (Sky Blue / Cyan)
  [VERSION_STATUS?.CONFIGURING || 'CONFIGURING']: {
    label: 'CONFIGURING',
    display: 'Configuration',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    solidBg: 'bg-sky-600 text-white border-sky-600',
    pulse: true,
    colorName: 'sky',
  },
  'EN CONFIGURATION': {
    label: 'EN CONFIGURATION',
    display: 'Configuration',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    solidBg: 'bg-sky-600 text-white border-sky-600',
    pulse: true,
    colorName: 'sky',
  },

  // Validating & Testing (Indigo / Purple)
  [VERSION_STATUS?.VALIDATING || 'VALIDATING']: {
    label: 'VALIDATING',
    display: 'Validation',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    solidBg: 'bg-indigo-600 text-white border-indigo-600',
    pulse: true,
    colorName: 'indigo',
  },
  [APPLICATION_STATUS?.TESTING || 'TESTING']: {
    label: 'TESTING',
    display: 'En Test',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    solidBg: 'bg-indigo-600 text-white border-indigo-600',
    pulse: true,
    colorName: 'indigo',
  },
  'EN TEST': {
    label: 'EN TEST',
    display: 'En Test',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    solidBg: 'bg-indigo-600 text-white border-indigo-600',
    pulse: true,
    colorName: 'indigo',
  },

  // Ready for Release (Teal / Cyan)
  [VERSION_STATUS?.READY || 'READY']: {
    label: 'READY',
    display: 'Prête',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    solidBg: 'bg-teal-600 text-white border-teal-600',
    pulse: false,
    colorName: 'teal',
  },
  'PRÊTE': {
    label: 'PRÊTE',
    display: 'Prête',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    solidBg: 'bg-teal-600 text-white border-teal-600',
    pulse: false,
    colorName: 'teal',
  },

  // Superseded (Slate Gray)
  [VERSION_STATUS?.SUPERSEDED || 'SUPERSEDED']: {
    label: 'SUPERSEDED',
    display: 'Remplacée',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    solidBg: 'bg-slate-600 text-white border-slate-600',
    pulse: false,
    colorName: 'slate',
  },
  'REMPLACÉE': {
    label: 'REMPLACÉE',
    display: 'Remplacée',
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    solidBg: 'bg-slate-600 text-white border-slate-600',
    pulse: false,
    colorName: 'slate',
  },

  // Deprecated (Rose / Amber)
  [VERSION_STATUS?.DEPRECATED || 'DEPRECATED']: {
    label: 'DEPRECATED',
    display: 'Dépréciée',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    solidBg: 'bg-rose-600 text-white border-rose-600',
    pulse: false,
    colorName: 'rose',
  },
  'DÉPRÉCIÉE': {
    label: 'DÉPRÉCIÉE',
    display: 'Dépréciée',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    solidBg: 'bg-rose-600 text-white border-rose-600',
    pulse: false,
    colorName: 'rose',
  },

  // Suspended (Orange / Amber)
  [APPLICATION_STATUS?.SUSPENDED || 'SUSPENDED']: {
    label: 'SUSPENDED',
    display: 'Suspendue',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    solidBg: 'bg-amber-600 text-white border-amber-600',
    pulse: false,
    colorName: 'amber',
  },
  'SUSPENDUE': {
    label: 'SUSPENDUE',
    display: 'Suspendue',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    solidBg: 'bg-amber-600 text-white border-amber-600',
    pulse: false,
    colorName: 'amber',
  },

  // Archived (Muted Slate)
  [APPLICATION_STATUS?.ARCHIVED || 'ARCHIVED']: {
    label: 'ARCHIVED',
    display: 'Archivée',
    bg: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    solidBg: 'bg-slate-500 text-white border-slate-500',
    pulse: false,
    colorName: 'slate',
  },
  'ARCHIVÉE': {
    label: 'ARCHIVÉE',
    display: 'Archivée',
    bg: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    solidBg: 'bg-slate-500 text-white border-slate-500',
    pulse: false,
    colorName: 'slate',
  },

  // Error (Red with Pulse)
  [APPLICATION_STATUS?.ERROR || 'ERROR']: {
    label: 'ERROR',
    display: 'Erreur',
    bg: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-600',
    solidBg: 'bg-red-600 text-white border-red-600',
    pulse: true,
    colorName: 'red',
  },
  'ERREUR': {
    label: 'ERREUR',
    display: 'Erreur',
    bg: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-600',
    solidBg: 'bg-red-600 text-white border-red-600',
    pulse: true,
    colorName: 'red',
  },

  // Validation / Quality Severities
  [VALIDATION_SEVERITY?.ERROR || 'SEV_ERROR']: {
    label: 'ERROR',
    display: 'Bloquant',
    bg: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-600',
    solidBg: 'bg-rose-600 text-white border-rose-600',
    pulse: true,
    colorName: 'rose',
  },
  [VALIDATION_SEVERITY?.WARNING || 'WARNING']: {
    label: 'WARNING',
    display: 'Avertissement',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    solidBg: 'bg-amber-600 text-white border-amber-600',
    pulse: false,
    colorName: 'amber',
  },
  [VALIDATION_SEVERITY?.INFO || 'INFO']: {
    label: 'INFO',
    display: 'Information',
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    solidBg: 'bg-blue-600 text-white border-blue-600',
    pulse: false,
    colorName: 'blue',
  },
  PASS: {
    label: 'PASS',
    display: 'Conforme',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    solidBg: 'bg-emerald-600 text-white border-emerald-600',
    pulse: false,
    colorName: 'emerald',
  },
};

/**
 * Returns the badge configuration object for a given status string.
 *
 * @param {string} status - Raw status string
 * @returns {Object} Configuration with color classes, dot, label, and pulse behavior
 */
export function getStatusBadgeConfig(status) {
  if (!status) {
    return {
      label: 'UNKNOWN',
      display: 'Inconnu',
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      solidBg: 'bg-slate-600 text-white border-slate-600',
      pulse: false,
      colorName: 'slate',
    };
  }

  const normalized = String(status).trim().toUpperCase();
  return STATUS_CONFIG[normalized] || STATUS_CONFIG[status] || {
    label: status,
    display: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    solidBg: 'bg-slate-600 text-white border-slate-600',
    pulse: false,
    colorName: 'slate',
  };
}

/**
 * StatusBadge Component
 *
 * Renders a color-coded indicator badge based on lifecycle status definitions:
 * - Green for PUBLISHED / ACTIVE
 * - Blue for DRAFT
 * - Sky for CONFIGURING
 * - Indigo for VALIDATING / TESTING
 * - Slate for SUPERSEDED / ARCHIVED
 * - Red for ERROR
 *
 * @param {Object} props
 * @param {string} props.status - Lifecycle status string (e.g. 'PUBLISHED', 'DRAFT', 'ACTIVE')
 * @param {'xs' | 'sm' | 'md' | 'lg'} [props.size='md'] - Badge size
 * @param {string} [props.customLabel] - Optional custom label to override default
 * @param {boolean} [props.showDot=true] - Whether to show the circular indicator dot
 * @param {boolean} [props.pulse] - Optional pulse override
 * @param {'subtle' | 'solid' | 'pill'} [props.variant='subtle'] - Visual style variant
 * @param {string} [props.className] - Additional class names
 */
export function StatusBadge({
  status = 'DRAFT',
  size = 'md',
  customLabel = null,
  showDot = true,
  pulse = undefined,
  variant = 'subtle',
  className = '',
}) {
  const config = getStatusBadgeConfig(status);

  const isPulsing = pulse !== undefined ? pulse : config.pulse;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-xs font-bold gap-2',
  };

  const dotSizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const variantClasses = variant === 'solid' ? config.solidBg : config.bg;

  return (
    <span
      id={`status-badge-${String(status).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-2xs select-none transition-colors ${variantClasses} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizeClasses[size] || dotSizeClasses.md} ${variant === 'solid' ? 'bg-white' : config.dot} ${isPulsing ? 'animate-pulse' : ''}`}
        />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
}

export default StatusBadge;
