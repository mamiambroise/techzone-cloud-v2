import React from 'react';
import BMStatusBadge from './business-manager/BMStatusBadge.jsx';
export function ContextBar({ application, version, status, environment, tenant }) {
  return <dl aria-label="Contexte de travail" className="flex flex-wrap items-center gap-y-3 rounded-xl border border-slate-200/70 bg-white px-1 py-3 shadow-2xs">
    {[['Application',application],['Version',version],['Statut',status],['Environnement',environment],['Tenant',tenant]].map(([label,value]) => <div key={label} className="min-w-0 flex-1 basis-32 border-l border-slate-100 px-4 first:border-l-0"><dt className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="break-words text-xs font-semibold text-slate-700">{label === 'Statut' && value ? <BMStatusBadge status={value}/> : value || <span className="font-normal text-slate-400">Non sélectionné</span>}</dd></div>)}
  </dl>;
}
