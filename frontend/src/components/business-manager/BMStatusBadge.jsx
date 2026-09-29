const labels = {DRAFT:'Brouillon',CONFIGURING:'Configuration',VALIDATING:'Validation',READY:'Prête',ACTIVE:'Active',ARCHIVED:'Archivée',DISABLED:'Désactivée',SUPERSEDED:'Remplacée',DEPRECATED:'Dépréciée',HEALTHY:'Saine',WARNING:'Attention',DEGRADED:'Dégradée',CRITICAL:'Critique',PASS:'Réussie',FAIL:'Échec',BLOCKED:'Bloquée',NOT_EVALUATED:'Non évaluée'};
const colors = {ACTIVE:'bg-emerald-50 text-emerald-700',HEALTHY:'bg-emerald-50 text-emerald-700',PASS:'bg-emerald-50 text-emerald-700',READY:'bg-blue-50 text-blue-700',CONFIGURING:'bg-sky-50 text-sky-700',VALIDATING:'bg-violet-50 text-violet-700',WARNING:'bg-amber-50 text-amber-700',DEGRADED:'bg-amber-50 text-amber-700',CRITICAL:'bg-rose-50 text-rose-700',FAIL:'bg-rose-50 text-rose-700',BLOCKED:'bg-rose-50 text-rose-700'};
export default function BMStatusBadge({status}) {
  if(!status)return null;
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`} title={status}><span className="h-1 w-1 rounded-full bg-current"/>{labels[status] || status}</span>;
}
