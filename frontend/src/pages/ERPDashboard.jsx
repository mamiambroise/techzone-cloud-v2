import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { api } from '../services/apiClient.js';
import { ERP_STATUS_LABELS, useErpCatalog } from '../erp/useErpResources.js';

const CATEGORY_LABELS = {
  commercial: 'Commercial',
  finance: 'Finance',
  'stock-logistics': 'Stock & logistique',
  collaboration: 'Référentiels & collaboration',
  other: 'Autres',
};
const FILTERS = [
  ['ALL', 'Toutes'],
  ['AVAILABLE', 'Disponibles'],
  ['CONFIGURE', 'À configurer'],
  ['UNAVAILABLE', 'Indisponibles'],
];

function StatusBadge({ status }) {
  const tone = status === 'AVAILABLE'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : ['MODULE_DISABLED', 'PERMISSION_DENIED', 'UNAVAILABLE', 'AUTH_FAILED'].includes(status)
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : ['NOT_IMPLEMENTED', 'NOT_SUPPORTED'].includes(status)
        ? 'bg-slate-100 text-slate-700 border-slate-200'
        : 'bg-rose-50 text-rose-800 border-rose-200';
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${tone}`}><span aria-hidden="true">●</span>{ERP_STATUS_LABELS[status] || status}</span>;
}

function matchesFilter(resource, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'AVAILABLE') return resource.effectiveStatus === 'AVAILABLE';
  if (filter === 'CONFIGURE') return ['UNKNOWN', 'MODULE_DISABLED', 'PERMISSION_DENIED'].includes(resource.effectiveStatus);
  return ['UNAVAILABLE', 'NOT_SUPPORTED', 'NOT_IMPLEMENTED', 'ERROR', 'AUTH_FAILED'].includes(resource.effectiveStatus);
}

function ResourceCard({ resource, canManage, onToggle, busy }) {
  const operationLabels = resource.operations.filter((operation) => operation.adapterImplemented).map((operation) => ({ read: 'Lecture', create: 'Création', update: 'Modification', delete: 'Suppression' }[operation.key]));
  return <article data-erp-resource={resource.key} data-state={resource.effectiveStatus} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-medium text-slate-900">{resource.label}</h3><p className="mt-1 text-xs text-slate-500">{resource.adapterImplemented ? 'Adapter implémenté' : 'Adapter non implémenté'}</p></div><StatusBadge status={resource.effectiveStatus} /></div>
    <p className="mt-3 text-sm text-slate-700">{operationLabels.length ? operationLabels.join(' · ') : 'Aucune opération exécutable'}</p>
    <dl className="mt-3 space-y-1 text-xs text-slate-600"><div className="flex justify-between gap-3"><dt>Dolibarr</dt><dd className="text-right">{ERP_STATUS_LABELS[resource.providerStatus] || resource.providerStatus}</dd></div><div className="flex justify-between gap-3"><dt>Techzone</dt><dd className="text-right">{resource.platformAllowed ? 'Autorisé' : 'Interdit'}</dd></div></dl>
    {resource.diagnostic && <p className="mt-3 text-xs text-slate-500">{resource.diagnostic}</p>}
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {resource.routeKey && resource.adapterImplemented && <Link to={`/erp/${resource.routeKey}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">Ouvrir</Link>}
      {canManage && <button type="button" disabled={busy} onClick={() => onToggle(resource)} className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{resource.platformAllowed ? 'Interdire' : 'Autoriser'}</button>}
    </div>
  </article>;
}

function DashboardContent() {
  const { activeTenant } = useTenant();
  const { user } = useAuth();
  const { status, catalog, error, retry } = useErpCatalog(activeTenant?.id);
  const [filter, setFilter] = useState('ALL');
  const [busyKey, setBusyKey] = useState(null);
  const [testing, setTesting] = useState(false);
  const canManage = user?.isSuperAdmin === true || user?.permissions?.includes('iam:admin');
  const sections = useMemo(() => Object.entries(CATEGORY_LABELS).map(([category, label]) => [category, label, (catalog?.resources || []).filter((resource) => resource.category === category && matchesFilter(resource, filter))]).filter(([, , resources]) => resources.length), [catalog, filter]);

  const toggle = async (resource) => {
    setBusyKey(resource.key);
    try {
      await api.patch(`/erp/catalog/policy/${encodeURIComponent(resource.key)}`, { platformAllowed: !resource.platformAllowed }, { errorHandling: 'local' });
      await retry();
    } finally { setBusyKey(null); }
  };
  const testCapabilities = async () => {
    setTesting(true);
    try { await api.post('/erp-registry/test', undefined, { errorHandling: 'local' }); await retry(); } finally { setTesting(false); }
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-900">ERP / Dolibarr</h1><p className="mt-1 text-slate-600">Catalogue tenant-scoped des ressources, fondé sur les capacités réellement vérifiées.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={testCapabilities} disabled={testing || status === 'LOADING'} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">{testing ? 'Test en cours…' : 'Tester les capabilities'}</button><Link className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800" to="/settings/erp">Connexion ERP</Link></div></header>
    <nav aria-label="Espaces ERP" className="flex flex-wrap gap-4 text-sm text-blue-700"><Link to="/erp" aria-current="page">Vue d’ensemble</Link><Link to="/erp/ressources">Ressources</Link><Link to="/erps">Connexions</Link><Link to="/erp/mappings">Mappings</Link><Link to="/settings/erp">Paramètres et diagnostics</Link></nav>
    {status === 'LOADING' && <section aria-busy="true" aria-label="Chargement du catalogue ERP" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-slate-100" />)}</section>}
    {status === 'UNCONFIGURED' && <section role="status" className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold">Tenant requis</h2><p className="mt-1 text-sm text-slate-600">Sélectionnez un tenant pour consulter son catalogue ERP.</p></section>}
    {status === 'ERROR' && <section role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-5"><h2 className="font-semibold text-rose-900">Catalogue indisponible</h2><p className="mt-1 text-sm text-rose-800">{error?.response?.data?.message || error?.message || 'Le catalogue ERP ne peut pas être chargé.'}</p><button type="button" onClick={retry} className="mt-3 text-sm font-medium text-rose-900 underline">Réessayer</button></section>}
    {catalog && <>
      <section aria-label="Résumé du catalogue" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">Ressources</p><p className="mt-1 text-2xl font-semibold">{catalog.summary.total}</p></div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Disponibles</p><p className="mt-1 text-2xl font-semibold text-emerald-950">{catalog.summary.available}</p></div><div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm text-amber-800">Accès/module à configurer</p><p className="mt-1 text-2xl font-semibold text-amber-950">{catalog.summary.permissionDenied + catalog.summary.moduleDisabled}</p></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-600">Non vérifiées</p><p className="mt-1 text-2xl font-semibold">{catalog.summary.unknown}</p></div></section>
      <section className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Ressources ERP</h2><p className="mt-1 text-sm text-slate-600">Le statut effectif sépare l’implémentation, la politique plateforme et la preuve Dolibarr.</p></div><div role="group" aria-label="Filtrer les ressources" className="flex flex-wrap gap-2">{FILTERS.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md border px-3 py-1.5 text-sm ${filter === value ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>{label}</button>)}</div></div></section>
      {sections.map(([category, label, resources]) => <section key={category} aria-labelledby={`category-${category}`}><h2 id={`category-${category}`} className="mb-3 text-lg font-semibold text-slate-900">{label}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.key} resource={resource} canManage={canManage} onToggle={toggle} busy={busyKey === resource.key} />)}</div></section>)}
      {!sections.length && <section role="status" className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Aucune ressource ne correspond à ce filtre.</section>}
      <p className="text-sm text-slate-500">Aucune synchronisation n’est déduite de ce catalogue. Les données métier ne sont chargées que lorsque vous ouvrez une ressource.</p>
    </>}
  </div>;
}

export default function ERPDashboard() {
  const { activeTenant } = useTenant();
  return <DashboardContent key={activeTenant?.id || 'no-tenant'} />;
}
