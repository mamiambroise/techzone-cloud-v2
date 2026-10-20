import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Database, Layers3, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import RuntimeConfirmation from './RuntimeConfirmation.jsx';
import { BmBreadcrumb, BmButton, BmEmptyState, BmLoading, BmPage, BmPageHeader } from '../business-manager/bm/ui.jsx';
import { RuntimeError, RuntimePanel, RuntimeResource } from './RuntimePrimitives.jsx';
import RuntimeLaunch from './RuntimeLaunch.jsx';
import { ContextTable, ResolutionTable, RuntimeCache, RuntimeDiagnostics, RuntimeHistory, RuntimeOverview } from './RuntimeViews.jsx';
import { RUNTIME_SECTIONS, canRuntime, formatDate, resolutionIdentity } from './runtimeModel.js';
import { runtimeError, useRuntimeData, useRuntimeResolution } from './useRuntimeData.js';

const RuntimeDetail = lazy(() => import('./RuntimeDetail.jsx'));
const sectionTitles = { overview: 'Vue d’ensemble Runtime', applications: 'Applications en exécution', resolutions: 'Résolutions de packs', activations: 'Activations Runtime', context: 'Contextes d’exécution', resolver: 'Lancer une exécution', manifest: 'Manifeste effectif', effective: 'Configuration effective', cache: 'Cache Runtime', diagnostics: 'Diagnostics Runtime', history: 'Historique Runtime' };
const descriptions = {
  overview: 'Supervisez les applications publiées, leurs contextes et les conditions de leur exécution.',
  applications: 'Retrouvez les applications actives par version et environnement.',
  resolutions: 'Examinez les contrôles serveur et les exigences de chaque pack publié.',
  activations: 'Suivez les activations persistées, leur acteur et leur état de préparation.',
  context: 'Inspectez les versions, environnements et contextes d’exécution de votre tenant.',
  cache: 'Consultez les mesures réelles et invalidez uniquement le périmètre nécessaire.',
  diagnostics: 'Identifiez les blocages et remontez à la résolution concernée.',
  history: 'Consultez les résolutions, activations et désactivations disponibles.',
};
const navIcons = { overview: Activity, applications: Layers3, resolutions: ShieldCheck, activations: Play, context: Layers3, cache: Database, diagnostics: Activity, history: Clock3 };

export default function RuntimePage() {
  const { activeTenant } = useTenant();
  return <Workspace key={activeTenant?.id || 'no-tenant'} tenant={activeTenant} />;
}
function Workspace({ tenant }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const cleanPath = pathname.replace(/\/+$/, '');
  const section = cleanPath === '/runtime' ? 'overview' : cleanPath.split('/').pop();
  const selected = query.get('resolution') || '';
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState('success');
  const [actionError, setActionError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const lock = useRef(false);
  const actionController = useRef(null);
  const mounted = useRef(true);
  const resources = useRuntimeData(tenant?.id, user, revision);
  const detail = useRuntimeResolution(selected, tenant?.id, revision);
  const resolutions = Array.isArray(resources.resolutions?.data) ? resources.resolutions.data : [];
  const contexts = Array.isArray(resources.contexts?.data) ? resources.contexts.data : [];
  const applications = Array.isArray(resources.applications?.data) ? resources.applications.data : [];
  const allowed = permission => canRuntime(user, permission);
  const refresh = () => { setNow(Date.now()); setRevision(v => v + 1); };
  const loading = Object.values(resources).some(r => r.status === 'loading');
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => { mounted.current = false; actionController.current?.abort(); clearInterval(timer); };
  }, []);
  useEffect(() => { if (resources.resolutions?.status === 'ready') setUpdatedAt(new Date().toISOString()); }, [resources.resolutions]);
  function select(id, path = '/runtime/resolutions') { setActionError(null); navigate(`${path}?resolution=${encodeURIComponent(id)}`); }
  async function run(path, body, success) {
    if (lock.current || !tenant?.id) return;
    lock.current = true;
    actionController.current = new AbortController();
    setBusy(true); setActionError(null); setNotice('');
    try {
      const response = await api.post(`/runtime${path}`, body, { signal: actionController.current.signal, errorHandling: 'local' });
      if (!mounted.current) return;
      setConfirmation(null);
      setNotice(success);
      setNoticeTone(response.data?.status === 'BLOCKED' ? 'warning' : 'success');
      if (path === '/resolve' || path.endsWith('/reresolve')) {
        if (response.data?.resolutionId) select(response.data.resolutionId);
        if (response.data?.status === 'BLOCKED') setNotice('Résolution enregistrée : l’exécution est bloquée. Consultez les diagnostics.');
      }
      refresh();
    } catch (error) {
      if (mounted.current && !actionController.current.signal.aborted) { setConfirmation(null); setActionError(runtimeError(error)); }
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  function deactivate(resolution, context) {
    const identity = resolutionIdentity(resolution, applications);
    setConfirmation({ path: `/resolutions/${context.resolutionId}/deactivate`, body: {}, title: 'Désactiver cette application ?', message: `${identity.application} — environnement ${context.environment}. Le contexte actif sera fermé et les prochaines opérations de cette exécution seront refusées.`, confirmLabel: 'Désactiver', success: 'Application désactivée.', danger: true });
  }
  const detailView = <Suspense fallback={<BmLoading label="Chargement de l’inspecteur…" />}><RuntimeDetail key={`${selected}:${section === 'manifest' || section === 'effective' ? section : 'detail'}`} state={detail} tenantId={tenant?.id} applications={applications} contexts={contexts} allowed={allowed} busy={busy} onAction={run} onDeactivate={deactivate} onRetry={refresh} now={now} initialTab={section === 'manifest' ? 'manifest' : section === 'effective' ? 'configuration' : 'summary'} /></Suspense>;
  if (!tenant?.id) return <BmPage className="runtime-workspace"><BmPageHeader title="Pack Runtime" subtitle="Exécutez vos packs applicatifs dans un contexte vérifié." /><RuntimePanel><BmEmptyState icon={Layers3} title="Sélectionnez un tenant" description="Utilisez le sélecteur de tenant de l’en-tête pour charger ses applications et ses contextes Runtime." /></RuntimePanel></BmPage>;
  return <BmPage className="runtime-workspace">
    <BmBreadcrumb items={[{ label: 'Runtime', to: '/runtime' }, { label: sectionTitles[section] || 'Runtime' }]} />
    <div className="rt-header"><BmPageHeader title={sectionTitles[section] || 'Runtime'} subtitle={descriptions[section] || 'Vérifiez le contexte et le manifeste avant toute exécution.'} actions={<><BmButton variant="secondary" disabled={loading || busy} onClick={refresh} icon={<RefreshCw size={16} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} />}>Actualiser</BmButton>{allowed('runtime.resolve') && section !== 'resolver' && <Link to="/runtime/resolver" className="rt-primary-link"><Play size={15} aria-hidden="true" />Lancer un pack</Link>}</>} /><div className="rt-tenant-line"><span><Layers3 size={14} aria-hidden="true" />{tenant.name || tenant.code || tenant.id}</span><span>{updatedAt ? `Actualisé le ${formatDate(updatedAt)}` : 'Chargement des informations'}</span></div></div>
    <nav className="rt-navigation" aria-label="Sections Pack Runtime">{RUNTIME_SECTIONS.map(([id, path, label]) => { const Icon = navIcons[id]; return <NavLink key={id} end to={path + (selected ? `?resolution=${encodeURIComponent(selected)}` : '')}><Icon size={15} aria-hidden="true" />{label}</NavLink>; })}</nav>
    {notice && <div role="status" className={`rt-notice rt-notice--${noticeTone}`}><span aria-hidden="true">{noticeTone === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}</span><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Fermer la notification">×</button></div>}
    <RuntimeError error={actionError} onRetry={() => { setActionError(null); refresh(); }} />
    {busy && <div role="status" className="rt-operation"><RefreshCw size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Vérification et enregistrement côté serveur…</div>}
    {section === 'overview' && <RuntimeOverview resources={resources} resolutions={resolutions} contexts={contexts} applications={applications} now={now} onSelect={select} allowed={allowed} onAction={run} busy={busy} onRetry={refresh} />}
    {['overview','resolver'].includes(section) && <RuntimeLaunch tenantId={tenant.id} resources={resources} allowed={allowed} busy={busy} onResolve={form => run('/resolve', form, 'Résolution enregistrée. Examinez le résultat avant activation.')} initialQuery={query} />}
    {section === 'applications' && <RuntimePanel title="Applications actives" subtitle="Une ligne représente un contexte actif dans un environnement."><RuntimeResource resource={resources.contexts} onRetry={refresh}><ContextTable {...{contexts, resolutions, applications, now, allowed, busy}} activeOnly onSelect={select} onDeactivate={deactivate} /></RuntimeResource><Link className="rt-link rt-inline rt-spaced" to="/runtime/resolver">Préparer une nouvelle exécution <ArrowRight size={15} aria-hidden="true" /></Link></RuntimePanel>}
    {section === 'resolutions' && <RuntimePanel title="Résolutions enregistrées" subtitle="Les 100 dernières résolutions du tenant, filtrables et consultables."><RuntimeResource resource={resources.resolutions} onRetry={refresh}><ResolutionTable {...{resolutions, applications, now}} onSelect={select} /></RuntimeResource></RuntimePanel>}
    {['activations','context'].includes(section) && <RuntimePanel title={section === 'activations' ? 'Activations et états persistés' : 'Contextes Runtime'} subtitle="Identité, version, environnement, readiness et dernières opérations disponibles."><RuntimeResource resource={resources.contexts} onRetry={refresh}><ContextTable {...{contexts, resolutions, applications, now, allowed, busy}} onSelect={select} onDeactivate={deactivate} /></RuntimeResource></RuntimePanel>}
    {section === 'diagnostics' && <RuntimeResource resource={resources.resolutions} onRetry={refresh}><RuntimeDiagnostics {...{resolutions, applications}} onSelect={select} /></RuntimeResource>}
    {section === 'history' && <RuntimeResource resource={resources.resolutions} onRetry={refresh}><RuntimeResource resource={resources.contexts} onRetry={refresh}><RuntimeHistory {...{resolutions, contexts, applications}} onSelect={select} /></RuntimeResource></RuntimeResource>}
    {section === 'cache' && <RuntimeCache {...{resources, applications, allowed, busy}} onConfirm={setConfirmation} onRetry={refresh} />}
    {(['context','manifest','effective'].includes(section) || selected && section !== 'cache') && detailView}
    {!selected && ['resolutions','diagnostics','activations'].includes(section) && <p className="rt-footnote">Sélectionnez une ligne pour consulter le manifeste effectif, les diagnostics et le journal des étapes.</p>}
    <RuntimeConfirmation open={Boolean(confirmation)} title={confirmation?.title} message={confirmation?.message} confirmLabel={confirmation?.confirmLabel} danger={confirmation?.danger} loading={busy} onCancel={() => { if (!busy) setConfirmation(null); }} onConfirm={() => { if (confirmation) run(confirmation.path, confirmation.body, confirmation.success); }} />
  </BmPage>;
}
