import React from 'react';
export function ContextBar({ application, version, status, environment, tenant }) {
  return <dl aria-label="Contexte de travail" className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
    {[['Application',application],['Version',version],['Statut',status],['Environnement',environment],['Tenant',tenant]].map(([label,value]) => <div key={label} className="min-w-0"><dt className="inline text-slate-500">{label} : </dt><dd className="inline break-all font-medium text-slate-800">{value || 'Non sélectionné'}</dd></div>)}
  </dl>;
}
