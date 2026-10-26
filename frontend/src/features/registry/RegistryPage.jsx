import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Layers,
  Package,
  RefreshCw,
  Search,
  Shield,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { registryService } from '../../services/api/registryService.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { ROUTES } from '../../app/routes.js';

const tabs = [
  ['registry', 'Vue d’ensemble', ROUTES.registry],
  ['registrySources', 'Sources', ROUTES.registrySources],
  ['registryEntries', 'Entrées', ROUTES.registryEntries],
  ['registryVersions', 'Versions', ROUTES.registryVersions],
  ['registryCapabilities', 'Capacités', ROUTES.registryCapabilities],
  ['registryProviders', 'Providers', ROUTES.registryProviders],
  ['registrySchemas', 'Schémas', ROUTES.registrySchemas],
  ['registryCompatibility', 'Compatibilité', ROUTES.registryCompatibility],
  ['registryAvailability', 'Disponibilité', ROUTES.registryAvailability],
  ['registryDiagnostics', 'Diagnostics', ROUTES.registryDiagnostics],
  ['registryAudit', 'Audit', ROUTES.registryAudit],
];

const namespaces = ['BUSINESS', 'UI', 'AUTOMATION', 'DATA', 'INTEGRATION', 'RUNTIME', 'API', 'PLATFORM'];
const subdomains = {
  BUSINESS: ['BUSINESS_FEATURE', 'BUSINESS_CAPABILITY', 'BUSINESS_EVENT'],
  UI: ['UI_COMPONENT', 'UI_ACTION', 'UI_TEMPLATE'],
  AUTOMATION: ['AUTOMATION_NODE', 'AUTOMATION_TRIGGER', 'AUTOMATION_ACTION'],
  DATA: ['DATA_PROVIDER', 'DATA_REPOSITORY', 'DATA_CONTRACT', 'DATA_CAPABILITY'],
  INTEGRATION: ['INTEGRATION_CONNECTOR', 'INTEGRATION_CONTRACT', 'INTEGRATION_CAPABILITY'],
  RUNTIME: ['RUNTIME_CAPABILITY', 'RUNTIME_SCHEMA'],
  API: ['API_CONTRACT', 'API_VERSION', 'API_SCOPE'],
  PLATFORM: ['PLATFORM_CAPABILITY', 'PLATFORM_SCHEMA', 'PLATFORM_SERVICE'],
};
const entryTypes = ['FEATURE', 'CAPABILITY', 'EVENT', 'COMPONENT', 'ACTION', 'TEMPLATE', 'NODE', 'TRIGGER', 'PROVIDER', 'REPOSITORY', 'CONTRACT', 'VERSION', 'SCOPE', 'CONNECTOR', 'SCHEMA', 'SERVICE'];

const titleByPage = {
  registry: 'Registry transversal',
  registrySources: 'Sources du Registry',
  registryEntries: 'Entrées du Registry',
  registryVersions: 'Versions du Registry',
  registryCapabilities: 'Explorateur de capacités',
  registryProviders: 'Providers',
  registrySchemas: 'Schémas',
  registryCompatibility: 'Compatibilité',
  registryAvailability: 'Disponibilité par environnement',
  registryDiagnostics: 'Diagnostics Registry',
  registryAudit: 'Audit Registry',
  registryEntryDetail: 'Détail de l’entrée',
};

function hasPermission(user, permission) {
  return user?.isSuperAdmin === true || user?.permissions?.includes('*') || user?.permissions?.includes(permission);
}

function StatusBadge({ value }) {
  const style = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    COMPATIBLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    REGISTERED: 'bg-slate-100 text-slate-700 ring-slate-200',
    CONFIGURED: 'bg-blue-50 text-blue-700 ring-blue-200',
    REACHABLE: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    DEPRECATED: 'bg-amber-50 text-amber-700 ring-amber-200',
    DEGRADED: 'bg-amber-50 text-amber-700 ring-amber-200',
    DISABLED: 'bg-rose-50 text-rose-700 ring-rose-200',
    REMOVED: 'bg-rose-50 text-rose-700 ring-rose-200',
    UNAVAILABLE: 'bg-rose-50 text-rose-700 ring-rose-200',
    INCOMPATIBLE: 'bg-rose-50 text-rose-700 ring-rose-200',
    UNKNOWN: 'bg-slate-100 text-slate-600 ring-slate-200',
  }[value] ?? 'bg-slate-100 text-slate-700 ring-slate-200';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>{value || 'UNKNOWN'}</span>;
}

function DataTable({ headers, children, empty = 'Aucune donnée enregistrée dans le Registry.' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th className="px-4 py-3 font-semibold" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children}
          </tbody>
        </table>
      </div>
      {React.Children.count(children) === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

function Cell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-middle text-slate-700 ${className}`}>{children ?? '—'}</td>;
}

function StatCard({ label, value, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`rounded-xl p-2 ${tones[tone]}`}><Icon size={17} aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value ?? 0}</p>
    </div>
  );
}

function RegistryTable({ entries }) {
  return (
    <DataTable headers={['Clé', 'Namespace', 'Version', 'Owner', 'Provider', 'Scope', 'Statut']}>
      {entries.map((entry) => (
        <tr key={entry.id} className="hover:bg-slate-50">
          <Cell className="font-mono text-xs">
            <Link className="font-semibold text-blue-700 hover:underline" to={ROUTES.registryEntryDetail.replace(':registryEntryId', encodeURIComponent(entry.id))}>
              {entry.key}
            </Link>
            <span className="mt-1 block text-[11px] font-normal text-slate-500">{entry.subDomain}</span>
          </Cell>
          <Cell>{entry.namespace?.namespace}</Cell>
          <Cell className="font-mono">{entry.version}</Cell>
          <Cell>{entry.owner}</Cell>
          <Cell>{entry.provider}</Cell>
          <Cell>{entry.scope}{entry.scopeId && entry.scope !== 'GLOBAL' ? ` · ${entry.scopeId}` : ''}</Cell>
          <Cell><StatusBadge value={entry.status} /></Cell>
        </tr>
      ))}
    </DataTable>
  );
}

export default function RegistryPage({ pageId = 'registry', title, description }) {
  const { user } = useAuth();
  const { registryEntryId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [requirement, setRequirement] = useState({ key: '', version: '', versionRange: '', environmentCode: '', capabilities: '', schemaRef: '' });
  const [resolution, setResolution] = useState(null);
  const [registration, setRegistration] = useState({ namespace: 'UI', subDomain: 'UI_COMPONENT', key: '', version: '1.0.0', type: 'COMPONENT', capabilities: '', schemaRef: '', description: '' });
  const [entryAction, setEntryAction] = useState({ reason: '', replacementKey: '', removalTarget: '', confirmRemoval: false });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      switch (pageId) {
        case 'registry':
          result = await Promise.all([registryService.overview(), registryService.sources()]);
          break;
        case 'registrySources':
          result = await registryService.sources();
          break;
        case 'registryEntries':
        case 'registryVersions':
          result = await registryService.entries(search ? { query: search } : undefined);
          break;
        case 'registryEntryDetail':
          result = await registryService.entry(registryEntryId);
          break;
        case 'registryCapabilities':
          result = await registryService.capabilities(search ? { query: search } : undefined);
          break;
        case 'registryProviders':
          result = await registryService.providers();
          break;
        case 'registrySchemas':
          result = await registryService.schemas();
          break;
        case 'registryCompatibility':
          result = await registryService.compatibility();
          break;
        case 'registryAvailability':
          result = await registryService.availability();
          break;
        case 'registryDiagnostics':
          result = await registryService.diagnostics();
          break;
        case 'registryAudit':
          result = await registryService.audit();
          break;
        default:
          result = [];
      }
      setData(result);
    } catch (loadError) {
      setData(null);
      setError(loadError?.normalized?.message ?? loadError?.response?.data?.message ?? 'Impossible de charger les données Registry.');
    } finally {
      setLoading(false);
    }
  }, [pageId, registryEntryId, search, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const entries = useMemo(
    () => Array.isArray(data) ? data : [],
    [data],
  );

  const changeRegistration = (event) => {
    const { name, value } = event.target;
    setRegistration((current) => ({
      ...current,
      [name]: value,
      ...(name === 'namespace' ? { subDomain: subdomains[value][0] } : {}),
    }));
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await registryService.register({
        namespace: registration.namespace,
        subDomain: registration.subDomain,
        key: registration.key,
        version: registration.version,
        type: registration.type,
        description: registration.description,
        schemaRef: registration.schemaRef || undefined,
        capabilities: registration.capabilities.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setNotice('Entrée enregistrée. Son statut initial reste REGISTERED tant que sa disponibilité réelle n’est pas établie.');
      setRegistration((current) => ({ ...current, key: '', capabilities: '', description: '' }));
      setRefreshKey((current) => current + 1);
    } catch (submitError) {
      setError(submitError?.normalized?.message ?? submitError?.response?.data?.message ?? 'Échec de l’enregistrement Registry.');
    } finally {
      setBusy(false);
    }
  };

  const submitResolution = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await registryService.resolve({
        key: requirement.key,
        version: requirement.version || undefined,
        versionRange: requirement.versionRange || undefined,
        environmentCode: requirement.environmentCode || undefined,
        requiredCapabilities: requirement.capabilities.split(',').map((item) => item.trim()).filter(Boolean),
        schemaRef: requirement.schemaRef || undefined,
      });
      setResolution(result);
    } catch (resolveError) {
      setError(resolveError?.normalized?.message ?? resolveError?.response?.data?.message ?? 'Échec de la résolution de compatibilité.');
      setResolution(null);
    } finally {
      setBusy(false);
    }
  };

  const submitEntryAction = async (event, action) => {
    event.preventDefault();
    if (!entryAction.reason.trim()) {
      setError('Un motif est obligatoire pour modifier le statut Registry.');
      return;
    }
    if (action === 'remove' && !entryAction.confirmRemoval) {
      setError('Confirmez le retrait avant de continuer.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (action === 'deprecate') {
        await registryService.deprecate(registryEntryId, {
          message: entryAction.reason,
          replacementKey: entryAction.replacementKey || undefined,
          removalTarget: entryAction.removalTarget || undefined,
        });
      } else if (action === 'disable') {
        await registryService.disable(registryEntryId, entryAction.reason);
      } else {
        await registryService.remove(registryEntryId, entryAction.reason);
      }
      setNotice('Le statut Registry a été mis à jour et audité.');
      setEntryAction((current) => ({ ...current, reason: '', confirmRemoval: false }));
      setRefreshKey((current) => current + 1);
    } catch (actionError) {
      setError(actionError?.normalized?.message ?? actionError?.response?.data?.message ?? 'Échec de la modification du statut Registry.');
    } finally {
      setBusy(false);
    }
  };

  const canRegister = hasPermission(user, 'registry.manage') || hasPermission(user, `registry.namespace.${registration.namespace.toLowerCase()}.write`);
  const pageTitle = titleByPage[pageId] ?? title ?? 'Registry';

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500" role="status"><RefreshCw size={18} className="animate-spin" />Chargement des données Registry…</div>;
  }

  return (
    <main className="tz-page space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        title={pageTitle}
        subtitle={description ?? 'Catalogue transversal des modules, contrats, capacités, versions et compatibilités effectivement enregistrés.'}
      />

      <nav aria-label="Sections Registry" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label, href]) => (
          <Link
            key={id}
            to={href}
            aria-current={pageId === id ? 'page' : undefined}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${pageId === id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      {pageId === 'registry' && Array.isArray(data) && (
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Entrées" value={data[0]?.total} icon={Package} />
            <StatCard label="Disponibles" value={data[0]?.available} icon={CheckCircle2} tone="green" />
            <StatCard label="Dépréciées" value={data[0]?.deprecated} icon={AlertTriangle} tone="amber" />
            <StatCard label="Indisponibles" value={data[0]?.unavailable} icon={XCircle} tone="red" />
            <StatCard label="Désactivées" value={data[0]?.disabled} icon={Shield} tone="red" />
            <StatCard label="Conflits connus" value={data[0]?.conflicts} icon={Activity} tone="violet" />
            <StatCard label="Providers" value={data[0]?.providers} icon={Boxes} />
            <StatCard label="Schémas" value={data[0]?.schemas} icon={Layers} />
          </div>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Namespaces enregistrés</h2>
            <DataTable headers={['Namespace', 'Autorité', 'Portée globale', 'Entrées visibles']}>
              {data[1]?.map((namespace) => (
                <tr key={namespace.id}>
                  <Cell className="font-semibold">{namespace.namespace}</Cell>
                  <Cell>{namespace.authority}</Cell>
                  <Cell>{namespace.isGlobal ? 'Oui' : 'Non'}</Cell>
                  <Cell>{namespace._count?.entries ?? 0}</Cell>
                </tr>
              ))}
            </DataTable>
          </section>
        </section>
      )}

      {pageId === 'registrySources' && (
        <DataTable headers={['Namespace', 'Autorité responsable', 'Global', 'Entrées visibles']}>
          {entries.map((source) => (
            <tr key={source.id}><Cell className="font-semibold">{source.namespace}</Cell><Cell>{source.authority}</Cell><Cell>{source.isGlobal ? 'Oui' : 'Non'}</Cell><Cell>{source._count?.entries ?? 0}</Cell></tr>
          ))}
        </DataTable>
      )}

      {(pageId === 'registryEntries' || pageId === 'registryVersions') && (
        <section className="space-y-5">
          <label className="relative block max-w-lg">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Rechercher dans le Registry</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une clé, un owner…" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600" />
          </label>
          {pageId === 'registryEntries' && canRegister && (
            <form onSubmit={submitRegistration} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
              <h2 className="sm:col-span-2 lg:col-span-4 text-base font-semibold text-slate-900">Enregistrer une entrée technique</h2>
              <label className="text-xs font-medium text-slate-600">Namespace
                <select name="namespace" value={registration.namespace} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                  {namespaces.map((namespace) => <option key={namespace}>{namespace}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">Sous-domaine
                <select name="subDomain" value={registration.subDomain} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                  {subdomains[registration.namespace].map((subDomain) => <option key={subDomain}>{subDomain}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">Clé
                <input required name="key" value={registration.key} onChange={changeRegistration} placeholder="table" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">Version SemVer
                <input required name="version" value={registration.version} onChange={changeRegistration} placeholder="1.0.0" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">Type
                <select name="type" value={registration.type} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm">
                  {entryTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">Capacités (séparées par virgule)
                <input name="capabilities" value={registration.capabilities} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600">Référence du schéma
                <input name="schemaRef" value={registration.schemaRef} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">Description
                <input name="description" value={registration.description} onChange={changeRegistration} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              <div className="flex items-end"><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
              <p className="sm:col-span-2 lg:col-span-4 text-xs text-slate-500">Owner et provider sont dérivés de l’autorité du namespace. Le statut est initialisé à REGISTERED; aucune disponibilité n’est simulée.</p>
            </form>
          )}
          <RegistryTable entries={entries} />
        </section>
      )}

      {pageId === 'registryEntryDetail' && data && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono text-xs text-slate-500">{data.namespace?.namespace} · {data.subDomain}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{data.displayName || data.key}</h2><p className="mt-1 text-sm text-slate-600">{data.description || 'Aucune description enregistrée.'}</p></div>
              <StatusBadge value={data.status} />
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[['Version', data.version], ['Owner', data.owner], ['Provider', data.provider], ['Scope', `${data.scope} · ${data.scopeId}`], ['Schéma', data.schemaRef], ['Source', data.sourceModule]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-800">{value || '—'}</dd></div>)}
            </dl>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4"><h3 className="font-semibold text-slate-900">Capacités</h3><ul className="mt-3 space-y-2">{data.capabilities?.map((capability) => <li key={capability.id} className="flex justify-between border-b border-slate-100 pb-2 text-sm"><span>{capability.name}</span><code className="text-xs text-slate-500">{capability.code}</code></li>)}</ul>{!data.capabilities?.length && <p className="mt-3 text-sm text-slate-500">Aucune capacité associée.</p>}</div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4"><h3 className="font-semibold text-slate-900">Disponibilité observée</h3><ul className="mt-3 space-y-2">{data.availabilities?.map((availability) => <li key={availability.id} className="flex justify-between border-b border-slate-100 pb-2 text-sm"><span>{availability.environmentCode || 'Tous environnements'}</span><StatusBadge value={availability.effectiveStatus} /></li>)}</ul>{!data.availabilities?.length && <p className="mt-3 text-sm text-slate-500">Aucun état de disponibilité enregistré.</p>}</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <h3 className="font-semibold text-slate-900">Packs publiés qui verrouillent cette entrée</h3>
              <ul className="mt-3 space-y-2">
                {data.references?.publishedPacks?.map((reference) => (
                  <li key={reference.packVersionId} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2 text-sm">
                    <span className="font-medium text-slate-800">{reference.packVersion.pack.name} · {reference.packVersion.pack.code}</span>
                    <span className="font-mono text-xs text-slate-500">v{reference.packVersion.versionNumber}</span>
                  </li>
                ))}
              </ul>
              {!data.references?.publishedPacks?.length && <p className="mt-3 text-sm text-slate-500">Aucune référence de Pack publiée dans votre tenant.</p>}
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <h3 className="font-semibold text-slate-900">Contextes Runtime exécutables</h3>
              <ul className="mt-3 space-y-2">
                {data.references?.runtimeContexts?.map((reference) => (
                  <li key={reference.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2 text-sm">
                    <span className="font-mono text-xs text-slate-700">{reference.applicationId}</span>
                    <span className="text-slate-600">{reference.environment}</span>
                  </li>
                ))}
              </ul>
              {!data.references?.runtimeContexts?.length && <p className="mt-3 text-sm text-slate-500">Aucun contexte Runtime exécutable dans votre tenant.</p>}
            </div>
          </div>
          {data.status !== 'REMOVED' && (hasPermission(user, 'registry.deprecate') || hasPermission(user, 'registry.disable') || hasPermission(user, 'registry.remove')) && (
            <form className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4" onSubmit={(event) => event.preventDefault()}>
              <div>
                <h3 className="font-semibold text-slate-900">Gestion du cycle de vie</h3>
                <p className="mt-1 text-sm text-slate-600">Chaque action exige un motif et est enregistrée dans l’audit. Un retrait utilisé par un Pack publié ou un contexte Runtime sera refusé par le serveur.</p>
              </div>
              <label className="block text-xs font-medium text-slate-600">Motif requis
                <textarea value={entryAction.reason} onChange={(event) => setEntryAction({ ...entryAction, reason: event.target.value })} required rows={2} maxLength={1000} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </label>
              {hasPermission(user, 'registry.deprecate') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">Clé de remplacement (facultative)
                    <input value={entryAction.replacementKey} onChange={(event) => setEntryAction({ ...entryAction, replacementKey: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Date cible de retrait (facultative)
                    <input type="date" value={entryAction.removalTarget} onChange={(event) => setEntryAction({ ...entryAction, removalTarget: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
                  </label>
                </div>
              )}
              {hasPermission(user, 'registry.remove') && (
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={entryAction.confirmRemoval} onChange={(event) => setEntryAction({ ...entryAction, confirmRemoval: event.target.checked })} className="mt-0.5 rounded border-slate-300" />
                  <span>Je confirme le retrait de cette entrée. Les références actives bloqueront l’opération.</span>
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                {hasPermission(user, 'registry.deprecate') && <button type="button" disabled={busy} onClick={(event) => submitEntryAction(event, 'deprecate')} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">Déprécier</button>}
                {hasPermission(user, 'registry.disable') && <button type="button" disabled={busy} onClick={(event) => submitEntryAction(event, 'disable')} className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Désactiver</button>}
                {hasPermission(user, 'registry.remove') && <button type="button" disabled={busy || !entryAction.confirmRemoval} onClick={(event) => submitEntryAction(event, 'remove')} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50">Retirer</button>}
              </div>
            </form>
          )}
        </section>
      )}

      {pageId === 'registryCapabilities' && (
        <section className="space-y-4">
          <label className="relative block max-w-lg"><Search size={16} className="absolute left-3 top-3 text-slate-400" aria-hidden="true" /><span className="sr-only">Rechercher une capacité</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une capacité…" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm" /></label>
          <DataTable headers={['Code', 'Nom', 'Entrée', 'Namespace', 'Version', 'Provider']}>
            {entries.map((item) => <tr key={item.id}><Cell className="font-mono text-xs">{item.code}</Cell><Cell>{item.name}</Cell><Cell>{item.entry?.key}</Cell><Cell>{item.entry?.namespace?.namespace}</Cell><Cell>{item.entry?.version}</Cell><Cell>{item.entry?.provider}</Cell></tr>)}
          </DataTable>
        </section>
      )}

      {pageId === 'registryProviders' && (
        <DataTable headers={['Provider', 'Owner', 'Type', 'Entrées visibles', 'Inscription']}>
          {entries.map((provider) => <tr key={provider.id}><Cell className="font-semibold">{provider.name}</Cell><Cell>{provider.provider}</Cell><Cell>{provider.isCore ? 'Core' : 'Module'}</Cell><Cell>{provider.entries}</Cell><Cell>Déclaré</Cell></tr>)}
        </DataTable>
      )}

      {pageId === 'registrySchemas' && (
        <DataTable headers={['Code', 'Version', 'Nom', 'État', 'Support déclaré']}>
          {entries.map((schema) => <tr key={schema.id}><Cell className="font-mono">{schema.code}</Cell><Cell>{schema.version}</Cell><Cell>{schema.name}</Cell><Cell><StatusBadge value={schema.status} /></Cell><Cell>{Array.isArray(schema.supportedBy) ? schema.supportedBy.join(', ') : '—'}</Cell></tr>)}
        </DataTable>
      )}

      {pageId === 'registryCompatibility' && (
        <section className="space-y-5">
          <form onSubmit={submitResolution} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <h2 className="sm:col-span-2 lg:col-span-3 text-base font-semibold text-slate-900">Évaluer une exigence contre les entrées enregistrées</h2>
            <label className="text-xs font-medium text-slate-600">Clé stable
              <input required value={requirement.key} onChange={(event) => setRequirement({ ...requirement, key: event.target.value })} placeholder="ui.component.table" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Version verrouillée (facultative)
              <input value={requirement.version} onChange={(event) => setRequirement({ ...requirement, version: event.target.value, versionRange: '' })} placeholder="1.2.0" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Plage SemVer (si non verrouillée)
              <input value={requirement.versionRange} onChange={(event) => setRequirement({ ...requirement, versionRange: event.target.value, version: '' })} placeholder="^1.0.0" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Environnement
              <input value={requirement.environmentCode} onChange={(event) => setRequirement({ ...requirement, environmentCode: event.target.value })} placeholder="PRODUCTION" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Capacités requises
              <input value={requirement.capabilities} onChange={(event) => setRequirement({ ...requirement, capabilities: event.target.value })} placeholder="pagination, export" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Schéma requis
              <input value={requirement.schemaRef} onChange={(event) => setRequirement({ ...requirement, schemaRef: event.target.value })} placeholder="ui.definition.v1" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
            </label>
            <div className="flex items-end"><button disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Évaluation…' : 'Évaluer'}</button></div>
          </form>
          {resolution && <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Résultat de résolution</h3><StatusBadge value={resolution.status} /></div>{resolution.selectedCandidate && <p className="mt-3 text-sm text-slate-700">Sélection déterministe : <strong>{resolution.selectedCandidate.stableKey}@{resolution.selectedCandidate.version}</strong> · {resolution.selectedCandidate.provider}</p>}{resolution.warnings?.map((warning) => <p key={warning} className="mt-2 text-sm text-amber-700">{warning}</p>)}{resolution.rejectedCandidates?.length > 0 && <div className="mt-4 space-y-2"><p className="text-sm font-medium text-slate-700">Candidats rejetés</p>{resolution.rejectedCandidates.map(({ candidate, reasons }) => <div key={candidate.id} className="rounded-lg bg-rose-50 p-3 text-sm"><span className="font-mono">{candidate.stableKey}@{candidate.version}</span><span className="ml-2 text-rose-700">{reasons.join(' · ')}</span></div>)}</div>}</div>}
          <DataTable headers={['Résultat', 'Version exigée', 'Entrée source', 'Vérifié le']}>
            {entries.map((item) => <tr key={item.id}><Cell><StatusBadge value={item.result} /></Cell><Cell>{item.requiredVersion}</Cell><Cell>{item.sourceEntry?.key}</Cell><Cell>{new Date(item.checkedAt).toLocaleString()}</Cell></tr>)}
          </DataTable>
        </section>
      )}

      {pageId === 'registryAvailability' && (
        <DataTable headers={['Entrée', 'Namespace', 'Version', 'Environnement', 'Registered', 'Configured', 'Reachable', 'État effectif']}>
          {entries.map((item) => <tr key={item.id}><Cell>{item.entry?.key}</Cell><Cell>{item.entry?.namespace?.namespace}</Cell><Cell>{item.entry?.version}</Cell><Cell>{item.environmentCode || 'Tous'}</Cell><Cell>{item.registered ? 'Oui' : 'Non'}</Cell><Cell>{item.configured ? 'Oui' : 'Non'}</Cell><Cell>{item.reachable ? 'Oui' : 'Non'}</Cell><Cell><StatusBadge value={item.effectiveStatus} /></Cell></tr>)}
        </DataTable>
      )}

      {pageId === 'registryDiagnostics' && (
        <DataTable headers={['Sévérité', 'Catégorie', 'Composant', 'Message', 'Entrée', 'Date']}>
          {entries.map((item) => <tr key={item.id}><Cell><StatusBadge value={item.severity} /></Cell><Cell>{item.category}</Cell><Cell>{item.component}</Cell><Cell>{item.message}</Cell><Cell>{item.entry?.key}</Cell><Cell>{new Date(item.createdAt).toLocaleString()}</Cell></tr>)}
        </DataTable>
      )}

      {pageId === 'registryAudit' && (
        <DataTable headers={['Action', 'Cible', 'Résultat', 'Acteur', 'Trace', 'Date']}>
          {entries.map((item) => <tr key={item.id}><Cell className="font-semibold">{item.action}</Cell><Cell>{item.targetType} · {item.targetId}</Cell><Cell><StatusBadge value={item.result} /></Cell><Cell>{item.actorId}</Cell><Cell className="font-mono text-xs">{item.traceId}</Cell><Cell>{new Date(item.createdAt).toLocaleString()}</Cell></tr>)}
        </DataTable>
      )}

      {!error && data !== null && (
        <p className="text-xs text-slate-500">Les résultats reflètent uniquement les données persistées et visibles pour le tenant courant. Les états de disponibilité ne sont pas simulés.</p>
      )}
    </main>
  );
}
