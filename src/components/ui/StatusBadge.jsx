"use client";

import React from "react";
export function StatusBadge({
  status,
  size = "md"
}) {
  const configs = {
    DRAFT: {
      label: "Brouillon",
      bg: "bg-slate-100",
      text: "text-slate-700",
      dot: "bg-slate-400",
      border: "border-slate-200"
    },
    CONFIGURING: {
      label: "Configuration",
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200"
    },
    READY: {
      label: "Prêt",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      border: "border-amber-200"
    },
    TESTING: {
      label: "En Test",
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
      border: "border-purple-200"
    },
    ACTIVE: {
      label: "Actif / Publié",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-200"
    },
    PUBLISHED: {
      label: "Publiée",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-200"
    },
    SUPERSEDED: {
      label: "Remplacée",
      bg: "bg-slate-100",
      text: "text-slate-600",
      dot: "bg-slate-400",
      border: "border-slate-200"
    },
    SUSPENDED: {
      label: "Suspendu",
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
      border: "border-orange-200"
    },
    ARCHIVED: {
      label: "Archivé",
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      border: "border-gray-200"
    },
    INVALID: {
      label: "Invalide",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      border: "border-red-200"
    },
    ERROR: {
      label: "Erreur",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
      border: "border-red-200"
    }
  };
  const config = configs[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-200"
  };
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold gap-2",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2.5"
  };
  return <span className={`inline-flex items-center rounded-full border transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>;
}
export function EnvironmentBadge({
  environment
}) {
  const configs = {
    DEVELOPMENT: {
      label: "Dev",
      bg: "bg-blue-100",
      text: "text-blue-800"
    },
    TEST: {
      label: "Test",
      bg: "bg-purple-100",
      text: "text-purple-800"
    },
    STAGING: {
      label: "Staging",
      bg: "bg-amber-100",
      text: "text-amber-800"
    },
    PRODUCTION: {
      label: "Prod",
      bg: "bg-emerald-100",
      text: "text-emerald-800"
    }
  };
  const c = configs[environment] || {
    label: environment,
    bg: "bg-slate-100",
    text: "text-slate-800"
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
      {c.label}
    </span>;
}