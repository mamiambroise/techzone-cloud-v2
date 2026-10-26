import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, CheckCircle2, Database, Layers3, PlayCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { BmButton, BmEmptyState } from '../business-manager/bm/ui.jsx';
import { RuntimeCollection, RuntimeFacts, RuntimePanel, RuntimeResource, RuntimeStatus } from './RuntimePrimitives.jsx';
import { contextStatus, formatDate, resolutionDiagnostics, resolutionIdentity, resolutionStatus, runtimeHistory, shortId } from './runtimeModel.js';

export function RuntimeOverview({ resources, resolutions, contexts, applications, now, onSelect, allowed, onAction, busy, onRetry }) {
  const available = resources.contexts?.status === 'ready';
  const active = contexts.filter(c => contextStatus(c, now) === 'ACTIVE');
  const counters = [
    ['Applications actives', available ? new Set(active.map(c => c.applicationId)).size : null, Layers3],
    ['Contextes actifs', available ? active.length : null, PlayCircle],
    ['Résolutions exécutables', resources.resolutions?.status === 'ready' ? resolutions.filter(r => resolutionStatus(r, now) === 'EXECUTABLE').length : null, CheckCircle2],
    ['Résolutions bloquées', resources.dashboard?.data?.counters?.blocked, ShieldAlert],
    ['Contextes dégradés', available ? contexts.filter(c => contextStatus(c, now) === 'DEGRADED').length : null, Activity],
  ];
  return <>
    <section className="rt-metrics" aria-label="Indicateurs Runtime">{counters.map(([label, value, Icon]) => <div key={label}><Icon size={19} aria-hidden="true" /><strong>{value ?? '—'}</strong><span>{label}</span></div>)}</section>
    <p className="rt-footnote">Applications et contextes calculés sur les 100 dernières résolutions accessibles. Le compteur des résolutions bloquées provient du total serveur.</p>
    <div className="rt-overview-grid"><RuntimePanel title="Applications en exécution" subtitle="Contextes actifs dans le tenant sélectionné." headerExtra={<Link className="rt-link" to="/runtime/applications">Tout voir</Link>}>
      <RuntimeResource resource={resources.contexts} onRetry={onRetry}>
        {!active.length ? <BmEmptyState icon={PlayCircle} title="Aucune application active dans les contextes chargés" description="Résolvez un pack publié, vérifiez ses exigences puis activez-le." action={<Link className="rt-link" to="/runtime/resolver">Préparer une exécution</Link>} /> : <div className="rt-active-list">{active.slice(0, 5).map(c => <button type="button" key={c.id} onClick={() => onSelect(c.resolutionId, '/runtime/context')}><span className="rt-app-icon"><Layers3 size={20} aria-hidden="true" /></span><span><strong>{applications.find(a => a.id === c.applicationId)?.name || shortId(c.applicationId)}</strong><small>{c.environment} · Activée le {formatDate(c.activatedAt)}</small></span><RuntimeStatus value={contextStatus(c, now)} /><ArrowUpRight size={17} aria-hidden="true" /></button>)}</div>}
      </RuntimeResource>
    </RuntimePanel><div className="rt-stack"><RuntimePanel title="Disponibilité des services" subtitle="Dernier contrôle disponible du backend.">
      <RuntimeResource resource={resources.health} label="Les contrôles de providers" onRetry={onRetry}><div className="rt-service-list">{(resources.health?.data?.providers || []).map(p => <div key={p.code}><Database size={18} aria-hidden="true" /><div><strong>{p.code}</strong><small>{p.latencyMs == null ? 'Latence non fournie' : `${p.latencyMs} ms`}</small></div><RuntimeStatus value={p.state} />{allowed('runtime.provider.probe') && <BmButton variant="ghost" size="sm" disabled={busy} onClick={() => onAction(`/providers/${encodeURIComponent(p.code)}/probe`, {}, 'Contrôle du provider terminé.')}><RefreshCw size={15} aria-hidden="true" /><span className="sr-only">Contrôler {p.code}</span></BmButton>}</div>)}{resources.health?.status === 'ready' && !(resources.health.data?.providers || []).length && <p className="rt-muted">Aucun provider retourné.</p>}</div></RuntimeResource>
    </RuntimePanel><RuntimePanel title="Cache d’exécution" headerExtra={<Link to="/runtime/cache" className="rt-link">Examiner</Link>}><RuntimeResource resource={resources.cache} label="Les métriques du cache" onRetry={onRetry}><RuntimeFacts facts={[["Couche", resources.cache?.data?.layer], ['Entrées', resources.cache?.data?.entries], ['Disponibilité', resources.cache?.data?.available === true ? 'Disponible' : 'Non vérifiée']]} /></RuntimeResource></RuntimePanel></div></div>
    <RuntimePanel title="Dernières résolutions" subtitle="Suivez les vérifications et ouvrez le détail des blocages."><RuntimeResource resource={resources.resolutions} onRetry={onRetry}><ResolutionTable resolutions={resolutions.slice(0, 10)} applications={applications} now={now} onSelect={onSelect} /></RuntimeResource></RuntimePanel>
  </>;
}

export function ResolutionTable({ resolutions, applications, now, onSelect }) {
  return <RuntimeCollection rows={resolutions} label="Rechercher une résolution" searchText={r => { const i = resolutionIdentity(r, applications); return `${r.id} ${i.application} ${i.pack} ${i.packVersion} ${i.environment}`; }} statuses={['EXECUTABLE','BLOCKED','ERROR','EXPIRED','PENDING','RESOLVING']} statusOf={r => resolutionStatus(r, now)} emptyTitle="Aucune résolution enregistrée" emptyDescription="Lancez une résolution depuis un pack publié pour examiner son exécution." columns={[
    { key: 'application', label: 'Application / pack', render: r => { const i = resolutionIdentity(r, applications); return <div className="rt-cell"><strong>{i.application}</strong><small>{i.pack} · {i.packVersion}</small></div>; } },
    { key: 'environment', label: 'Environnement' },
    { key: 'status', label: 'Résolution', render: r => <RuntimeStatus value={resolutionStatus(r, now)} /> },
    { key: 'startedAt', label: 'Créée le', render: r => formatDate(r.startedAt) },
    { key: 'expiresAt', label: 'Expire le', render: r => formatDate(r.result?.expiresAt) },
    { key: 'actions', label: 'Détail', render: r => <button type="button" className="rt-link" onClick={() => onSelect(r.id)}>Examiner <span className="sr-only">la résolution {shortId(r.id)}</span></button> },
  ]} />;
}

export function ContextTable({ contexts, resolutions, applications, now, activeOnly = false, onSelect, onDeactivate, allowed, busy }) {
  const rows = activeOnly ? contexts.filter(c => contextStatus(c, now) === 'ACTIVE') : contexts;
  return <RuntimeCollection rows={rows} label={activeOnly ? 'Rechercher une application active' : 'Rechercher un contexte'} statuses={activeOnly ? [] : ['ACTIVE','INACTIVE','EXPIRED','DEGRADED','BLOCKED','ERROR']} statusOf={c => contextStatus(c, now)} searchText={c => `${c.id} ${applications.find(a => a.id === c.applicationId)?.name || c.applicationId} ${c.environment} ${c.applicationVersionId}`} emptyTitle={activeOnly ? 'Aucune application active dans les contextes chargés' : 'Aucun contexte enregistré'} emptyDescription="Une activation réussie crée un contexte persistant pour l’application et son environnement." columns={[
    { key: 'applicationId', label: 'Application', render: c => <div className="rt-cell"><strong>{applications.find(a => a.id === c.applicationId)?.name || shortId(c.applicationId)}</strong><small>Contexte {shortId(c.id)}</small></div> },
    { key: 'version', label: 'Version / pack', render: c => { const r = resolutions.find(r => r.id === c.resolutionId); const i = r && resolutionIdentity(r, applications); return <div className="rt-cell"><strong>{i?.version || shortId(c.applicationVersionId)}</strong><small>{i ? `${i.pack} · ${i.packVersion}` : shortId(c.packVersionId)}</small></div>; } },
    { key: 'environment', label: 'Environnement' },
    { key: 'status', label: 'Contexte', render: c => <RuntimeStatus value={contextStatus(c, now)} /> },
    { key: 'readiness', label: 'Readiness', render: c => <RuntimeStatus value={contextStatus(c, now) === 'EXPIRED' ? 'NOT_READY' : c.readiness} /> },
    { key: 'activatedAt', label: 'Activation', render: c => <div className="rt-cell"><span>{formatDate(c.activatedAt)}</span><small>{c.activatedBy || 'Acteur non renseigné'}</small></div> },
    { key: 'actions', label: 'Actions', render: c => <div className="rt-actions"><button type="button" className="rt-link" onClick={() => onSelect(c.resolutionId, '/runtime/context')}>Détails</button>{contextStatus(c, now) === 'ACTIVE' && allowed('runtime.deactivate') && <BmButton variant="danger" size="sm" disabled={busy} onClick={() => onDeactivate(resolutions.find(r => r.id === c.resolutionId) || { id: c.resolutionId, applicationId: c.applicationId, environment: c.environment }, c)}>Désactiver</BmButton>}</div> },
  ]} footer="Périmètre : contextes persistés des 100 dernières résolutions retournées par le serveur." />;
}

export function RuntimeDiagnostics({ resolutions, applications, onSelect }) {
  const diagnostics = resolutionDiagnostics(resolutions);
  return <RuntimePanel title="Diagnostics Runtime" subtitle="Blocages, dépendances manquantes et incompatibilités enregistrés dans les résolutions."><RuntimeCollection rows={diagnostics} label="Rechercher un diagnostic" searchText={d => `${d.code} ${d.message} ${d.path || ''} ${d.environment} ${d.traceId || ''}`} statuses={['ERROR','WARNING','INFO']} statusOf={d => d.severity || 'UNKNOWN'} emptyTitle="Aucun diagnostic dans les résolutions chargées" emptyDescription="Les diagnostics apparaissent lors de la validation et de la résolution d’un pack." columns={[
    { key: 'code', label: 'Diagnostic', render: d => <div className="rt-cell"><strong>{d.code}</strong><span>{d.message}</span></div> },
    { key: 'severity', label: 'Sévérité', render: d => <RuntimeStatus value={d.severity} /> },
    { key: 'path', label: 'Ressource', render: d => d.path || d.resource || '—' },
    { key: 'applicationId', label: 'Application', render: d => applications.find(a => a.id === d.applicationId)?.name || shortId(d.applicationId) },
    { key: 'occurredAt', label: 'Date', render: d => formatDate(d.occurredAt) },
    { key: 'traceId', label: 'Corrélation', render: d => d.traceId ? <code title={d.traceId}>{shortId(d.traceId)}</code> : 'Disponible dans le détail, si enregistrée' },
    { key: 'actions', label: 'Détail', render: d => <button type="button" className="rt-link" onClick={() => onSelect(d.resolutionId, '/runtime/diagnostics')}>Examiner</button> },
  ]} /></RuntimePanel>;
}

export function RuntimeHistory({ resolutions, contexts, applications, onSelect }) {
  const rows = runtimeHistory(resolutions, contexts);
  return <RuntimePanel title="Historique des exécutions" subtitle="Événements disponibles dans les résolutions et les contextes persistés."><RuntimeCollection rows={rows} label="Rechercher dans l’historique" searchText={e => `${e.label} ${e.actor || ''} ${e.environment} ${applications.find(a => a.id === e.applicationId)?.name || e.applicationId}`} emptyTitle="Aucun événement Runtime disponible" columns={[
    { key: 'occurredAt', label: 'Date', render: e => formatDate(e.occurredAt) }, { key: 'label', label: 'Événement' },
    { key: 'applicationId', label: 'Application', render: e => applications.find(a => a.id === e.applicationId)?.name || shortId(e.applicationId) },
    { key: 'environment', label: 'Environnement' }, { key: 'status', label: 'État enregistré', render: e => <RuntimeStatus value={e.status} /> },
    { key: 'actor', label: 'Acteur', render: e => e.actor || 'Non fourni' },
    { key: 'actions', label: 'Détail', render: e => <button type="button" className="rt-link" onClick={() => onSelect(e.resolutionId)}>Ouvrir la résolution</button> },
  ]} footer="Cet historique est limité aux événements exposés par les API Runtime ; il ne remplace pas le journal d’audit global." /></RuntimePanel>;
}

export function RuntimeCache({ resources, applications, allowed, busy, onConfirm, onRetry }) {
  const [scope, setScope] = useState('TENANT');
  const [target, setTarget] = useState('');
  const cache = resources.cache?.data;
  const entries = resources.entries?.data || [];
  const metrics = cache?.metrics;
  const samples = metrics ? metrics.hit + metrics.miss : 0;
  const options = scope === 'PACK' ? [...new Set(entries.map(e => e.packCode).filter(Boolean))].map(code => ({ value: code, label: code }))
    : scope === 'APPLICATION' ? applications.map(a => ({ value: a.id, label: a.name })) : entries.map(e => ({ value: e.key, label: `${e.packCode || 'Pack'} · ${shortId(e.key)}` }));
  const valid = scope === 'TENANT' || options.some(o => o.value === target);
  function invalidate() {
    const selector = scope === 'PACK' ? { packCode: target } : scope === 'APPLICATION' ? { applicationId: target } : scope === 'ENTRY' ? { key: target } : {};
    onConfirm({ path: '/cache/invalidate', body: { scope, ...selector }, title: 'Invalider le cache Runtime ?', message: scope === 'TENANT' ? 'Toutes les entrées du cache de ce tenant seront supprimées. Les prochaines résolutions recalculeront leurs résultats.' : `Périmètre : ${options.find(o => o.value === target)?.label}. Les autres entrées seront conservées.`, confirmLabel: 'Invalider le cache', success: 'Cache invalidé.' });
  }
  return <RuntimePanel title="Cache Runtime" subtitle="Métriques du processus backend courant, isolées par tenant."><RuntimeResource resource={resources.cache} label="Le cache" onRetry={onRetry}>
    <RuntimeFacts facts={[["Couche", cache?.layer], ['Entrées', cache?.entries], ['Durée de validité', cache?.ttlMs == null ? null : `${cache.ttlMs / 1000} s`], ['Taux de succès', samples > 0 ? `${Math.round(metrics.hit / samples * 100)} %` : 'Aucune mesure'], ['Invalidations (entrées)', metrics?.invalidated], ['Requêtes en cours', cache?.inFlight]]} />
    {allowed('runtime.cache.invalidate') && <fieldset className="rt-cache-form"><legend>Invalidation ciblée</legend><label>Périmètre<select value={scope} onChange={e => { setScope(e.target.value); setTarget(''); }}><option value="TENANT">Tenant courant</option><option value="APPLICATION">Application</option><option value="PACK">Pack</option><option value="ENTRY">Entrée</option></select></label>{scope !== 'TENANT' && <label>Cible<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Choisir une cible</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}<BmButton variant="secondary" disabled={busy || !valid} onClick={invalidate}>Invalider le cache</BmButton></fieldset>}
    <RuntimeResource resource={resources.entries} label="Les entrées du cache" onRetry={onRetry}><RuntimeCollection rows={entries.map(e => ({ ...e, id: e.key }))} label="Rechercher une entrée du cache" searchText={e => `${e.packCode || ''} ${e.applicationId || ''} ${e.provider || ''}`} emptyTitle="Le cache est vide" emptyDescription="Les entrées apparaissent après une résolution. Leur contenu n’est jamais affiché." columns={[
      { key: 'packCode', label: 'Pack' }, { key: 'applicationId', label: 'Application', render: e => applications.find(a => a.id === e.applicationId)?.name || shortId(e.applicationId) }, { key: 'state', label: 'État', render: e => <RuntimeStatus value={e.state} /> }, { key: 'createdAt', label: 'Créée le', render: e => formatDate(e.createdAt) }, { key: 'expiresAt', label: 'Expiration', render: e => formatDate(e.expiresAt) },
    ]} /></RuntimeResource>
  </RuntimeResource></RuntimePanel>;
}
