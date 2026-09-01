// EnvironmentBadge.jsx — High-contrast environment pill
import React from 'react';

const ENV_CONFIG = {
  PRODUCTION: {
    label: 'PROD',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold',
  },
  STAGING: {
    label: 'STAGE',
    bg: 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold',
  },
  TEST: {
    label: 'TEST',
    bg: 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold',
  },
  DEVELOPMENT: {
    label: 'DEV',
    bg: 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold',
  },
};

export function EnvironmentBadge({ environment = 'DEVELOPMENT', size = 'sm' }) {
  const config = ENV_CONFIG[environment] || {
    label: environment,
    bg: 'bg-slate-50 text-slate-700 border-slate-300',
  };

  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span className={`inline-flex items-center uppercase tracking-wider rounded border ${config.bg} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
