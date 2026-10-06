import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowRight, Boxes, MoreVertical, Archive, Ban, CirclePlay } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader.jsx';
import {
  BmPage, BmBreadcrumb, BmKpiCard, BmStatusBadge, BmButton, BmSelect, BmIconButton,
  BmEmptyState, BmErrorState, BmLoading, bmSafeError,
} from './bm/ui.jsx';
import { getApplications } from '../../services/api/platformApplicationsService.js';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archivé' },
  { value: 'DISABLED', label: 'Désactivé' },
];

const SORT_OPTIONS = [
  { value: 'updated', label: 'Dernière modification' },
  { value: 'name', label: 'Nom (A→Z)' },
  { value: 'code', label: 'Code technique' },
];

export function BMApplicationsRoute() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('updated');

  useEffect(() => {
    let live = true;
    setLoading(true); setError(false);
    getApplications()
      .then((rows) => { if (live) setApplications(rows || []); })
      .catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [revision]);

  const filtered = applications
    .filter((app) => {
      const matchesStatus = status === 'ALL' || app.status === status;
      if (!matchesStatus) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return String(app.name || '').toLowerCase().includes(q)
        || String(app.code || '').toLowerCase().includes(q)
        || String(app.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
      if (sort === 'code') return String(a.code || '').localeCompare(String(b.code || ''), 'fr');
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

  const counts = {
    total: applications.length,
    active: applications.filter((app) => app.status === 'ACTIVE').length,
    archived: applications.filter((app) => app.status === 'ARCHIVED').length,
    disabled: applications.filter((app) => app.status === 'DISABLED').length,
  };

  return (
    <BmPage>
      <BmBreadcrumb items={[{ label: 'Business Manager', onClick: () => navigate('/business-manager') }, { label: 'Applications' }]} />
      <PageHeader
        title="Applications"
        subtitle="Gérez, configurez et suivez vos applications métier."
        action={{ label: 'Nouvelle application', onClick: () => navigate('/business-manager/applications/new') }}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BmKpiCard label="Total applications" value={counts.total} icon={<Boxes className="h-6 w-6" />} tone="blue" />
        <BmKpiCard label="Applications actives" value={counts.active} hint={counts.total > 0 ? `${Math.round((counts.active / counts.total) * 100)}% du total` : '—'} icon={<CirclePlay className="h-6 w-6" />} tone="green" />
        <BmKpiCard label="Archivées" value={counts.archived} icon={<Archive className="h-6 w-6" />} tone="amber" />
        <BmKpiCard label="Désactivées" value={counts.disabled} icon={<Ban className="h-6 w-6" />} tone="violet" />
      </div>

      {/* Toolbar : recherche / statut / tri — filtrage client, aucune donnée inventée */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une application"
            placeholder="Rechercher une application…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 bm-focus focus:border-blue-400"
          />
        </div>
        <BmSelect label="Filtrer par statut" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <BmSelect label="Trier" value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      {loading ? (
        <BmLoading label="Chargement des applications…" />
      ) : error ? (
        <BmErrorState onRetry={() => setRevision((r) => r + 1)} />
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
          <BmEmptyState
            icon={Boxes}
            title="Aucune application"
            description="Créez votre première application pour commencer à construire vos modèles, fonctionnalités et navigations."
            action={<BmButton onClick={() => navigate('/business-manager/applications/new')} icon={<Plus className="h-4 w-4" />}>Nouvelle application</BmButton>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
          <BmEmptyState
            icon={Search}
            title="Aucun résultat"
            description="Aucune application ne correspond à votre recherche ou filtre."
            action={<BmButton variant="secondary" size="sm" onClick={() => { setQuery(''); setStatus('ALL'); }}>Réinitialiser</BmButton>}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((app) => (
              <ApplicationCard key={app.id} app={app} onClick={() => navigate(`/business-manager/applications/${app.id}`)} />
            ))}
          </div>
          <p className="text-xs text-slate-500">{filtered.length} application(s) sur {applications.length}</p>
        </>
      )}
    </BmPage>
  );
}

export function ApplicationCard({ app, onClick }) {
  return (
    <article className="bm-hover-lift flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
          <Boxes className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">{app.name || app.code}</h3>
          <p className="truncate font-mono text-xs text-slate-400">{app.code}</p>
        </div>
        <BmIconButton label="Ouvrir l’application" onClick={onClick}><MoreVertical className="h-4 w-4" /></BmIconButton>
      </div>

      {app.description && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{app.description}</p>}

      <div className="mt-auto pt-4">
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <BmStatusBadge value={app.status} />
          <div>Modifié le {app.updatedAt || app.createdAt ? new Date(app.updatedAt || app.createdAt).toLocaleDateString('fr-FR') : '—'}</div>
        </dl>
        <button
          onClick={onClick}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors duration-150 hover:bg-blue-100 bm-focus"
        >
          Ouvrir l’application
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
