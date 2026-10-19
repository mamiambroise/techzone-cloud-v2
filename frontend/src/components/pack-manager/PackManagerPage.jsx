import RuleConditionEditor from './RuleConditionEditor.jsx';
import { createElement, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, Layers, ShieldCheck, Rocket, FileCheck2 } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { BmPage, BmPageHeader, BmBreadcrumb, BmContextBar, BmCard, BmKpiCard, BmButton, BmTabs, BmTable, BmStatusBadge, BmEmptyState, BmErrorState, BmLoading, BmSearchInput, BmSelect } from '../business-manager/bm/ui.jsx';
import { BMResourceEditor } from '../business-manager/BMResourceEditor.jsx';
import ConfirmModal from '../ui/ConfirmModal.jsx';
import { packFields, versionFields, resourceFields } from './packFields.js';

const root = '/pack-manager';
const get = path => api.get(root + path).then(r => r.data);
const sections = [['overview',"Vue d’ensemble"],['packs','Packs'],['versions','Versions'],['dependencies','Dépendances'],['requirements','Requirements'],['validation','Validation'],['manifest','Manifest'],['publication','Publications'],['history','Historique'],['modules','Modules'],['features','Fonctionnalités'],['capabilities','Capacités'],['rules','Règles'],['registry','Registry']];
const workspaceSections = sections.filter(([id]) => ['overview','versions','dependencies','requirements','validation','manifest','publication','history'].includes(id));
const compositionSections = sections.filter(([id]) => ['modules','features','capabilities','rules'].includes(id));
function requestError(error, fallback = 'Opération impossible.') {
  const status = error.response?.status;
  if (status === 401) return 'Session expirée : reconnectez-vous pour continuer.';
  if (status === 403) return 'Accès refusé : vous ne disposez pas de la permission nécessaire.';
  if (status === 404) return 'Cet élément est introuvable dans le tenant actif.';
  return error.normalized?.message || error.message || fallback;
}
export default function PackManagerPage() { const { activeTenant } = useTenant(); return <Workspace key={activeTenant?.id} tenant={activeTenant}/>; }
function Workspace({ tenant }) {
  const { pathname } = useLocation(), navigate = useNavigate(), [query,setQuery] = useSearchParams();
  const { user } = useAuth();
  const allowed = permission => user?.isAdmin || user?.permissions?.includes('*') || user?.permissions?.includes(permission);
  const section = pathname === '/packs' ? 'overview' : pathname.split('/').pop();
  const storage = `pm-context:${tenant?.id}`;
  const [saved] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storage) || '{}'); } catch { return {}; } });
  const packId = query.get('pack') ?? saved.packId ?? '', versionId = query.get('version') ?? saved.versionId ?? '';
  const [data,setData] = useState(null), [error,setError] = useState(''), [busy,setBusy] = useState(false), [revision,setRevision] = useState(0), [editor,setEditor] = useState(null), [search,setSearch] = useState(''), [filter,setFilter] = useState(''), [sort,setSort] = useState('updated'), [confirmation,setConfirmation] = useState(null), [manifestPanel,setManifestPanel] = useState('structured');
  const [applications,setApplications] = useState([]), [applicationVersions,setApplicationVersions] = useState([]), [selectedApplicationId,setSelectedApplicationId] = useState(''), [loadingApplicationVersions,setLoadingApplicationVersions] = useState(false);
  const refresh = () => setRevision(r => r+1);
  async function openVersionEditor(kind) {
    setError('');
    try {
      const response = await api.get('/business-manager/applications');
      if (!Array.isArray(response.data)) throw new Error('Réponse invalide lors du chargement des applications.');
      const sourceApplicationId = kind === 'clone' ? data?.version?.applicationVersion?.applicationId : data?.pack?.applicationId ?? selectedApplicationId;
      setApplications(response.data);
      setSelectedApplicationId(response.data.some(application => application.id === sourceApplicationId) ? sourceApplicationId : '');
      setApplicationVersions([]);
      setEditor({ kind });
    } catch (e) {
      setError(requestError(e,'Impossible de charger les applications du tenant.'));
    }
  }
  async function openPackEditor() {
    setError('');
    try {
      const response = await api.get('/business-manager/applications');
      if (!Array.isArray(response.data)) throw new Error('Réponse invalide lors du chargement des applications.');
      setApplications(response.data);
      setSelectedApplicationId('');
      setEditor({ kind:'pack' });
    } catch (error) {
      setError(requestError(error,'Impossible de charger les applications du tenant.'));
    }
  }
  useEffect(() => {
    if (data && section === 'packs' && query.get('create') === '1' && allowed('pack.create')) {
      void openPackEditor();
      const next = new URLSearchParams(query); next.delete('create'); setQuery(next,{ replace:true });
    }
  },[data,section,query]);
  useEffect(() => {
    let alive = true; setData(null); setError(''); setEditor(null);
    Promise.all([get('/dashboard'),get('/packs?limit=100'),get('/capabilities'),get('/registry'),packId ? get(`/packs/${packId}`) : null,versionId ? get(`/versions/${versionId}`) : null]).then(([dashboard,packs,capabilities,registry,pack,version]) => {
      if (version && version.packId !== pack?.id) throw new Error('Le contexte de version ne correspond pas au pack.');
      if (alive) setData({ dashboard,packs,capabilities,registry,pack,version });
    }).catch(e => { if (alive) setError(requestError(e,'Impossible de charger Pack Manager.')); });
    return () => { alive = false; };
  },[packId,versionId,revision]);
  useEffect(() => {
    let alive = true;
    if (!['version','clone'].includes(editor?.kind) || !selectedApplicationId) {
      setApplicationVersions([]);
      setLoadingApplicationVersions(false);
      return () => { alive = false; };
    }
    setLoadingApplicationVersions(true);
    setError('');
    api.get(`/business-manager/applications/${selectedApplicationId}/versions`).then(response => {
      if (!Array.isArray(response.data)) throw new Error('Réponse invalide lors du chargement des versions applicatives.');
      if (alive) setApplicationVersions(response.data.filter(applicationVersion => applicationVersion.applicationId === selectedApplicationId && ['DRAFT','CONFIGURING','READY','ACTIVE'].includes(applicationVersion.status)));
    }).catch(e => {
      if (alive) setError(requestError(e,'Impossible de charger les versions applicatives.'));
    }).finally(() => {
      if (alive) setLoadingApplicationVersions(false);
    });
    return () => { alive = false; };
  },[editor?.kind,selectedApplicationId]);
  function context(pack,version = '') { sessionStorage.setItem(storage,JSON.stringify({ packId:pack,versionId:version })); setQuery({ pack,version }); }
  const link = s => '/packs' + (s === 'overview' ? '' : '/' + s) + '?' + new URLSearchParams({ pack:packId,version:versionId });
  async function action(path,body = {}) { if (busy) return; setBusy(true); setError(''); try { await api.post(root+path,body); refresh(); } catch(e) { setError(requestError(e,'Opération refusée.')); } finally { setBusy(false); } }
  async function confirmAction() {
    const pending = confirmation;
    if (!pending || busy) return;
    setBusy(true); setError('');
    try { await pending.perform(); setConfirmation(null); refresh(); }
    catch(e) { setError(requestError(e,'Opération refusée.')); }
    finally { setBusy(false); }
  }
  const pack = data?.pack, version = data?.version;
  const mutable = version && !['PUBLISHED','SUPERSEDED','DEPRECATED','ARCHIVED'].includes(version.status) && !pack?.archivedAt;
  async function save(body) {
    if (editor.kind === 'pack-duplicate') { const r = await api.post(root+`/packs/${packId}/duplicate`,body); context(r.data.id); }
    else if (editor.kind === 'pack') { const r = await api.post(root+'/packs',body); context(r.data.id); }
    else if (editor.kind === 'pack-edit') await api.patch(root+`/packs/${packId}`,{ ...body,rowVersion:pack.rowVersion });
    else if (editor.kind === 'version' || editor.kind === 'clone') { const r = await api.post(root+(editor.kind === 'clone' ? `/versions/${versionId}/clone` : `/packs/${packId}/versions`),body); context(packId,r.data.id); }
    else if (editor.kind === 'attach') await api.post(root+`/features/${editor.row.id}/capabilities`,body);
    else if (section === 'capabilities' && editor.row) await api.patch(root+`/capabilities/${editor.row.id}`,{ ...body,updatedAt:editor.row.updatedAt });
    else if (editor.row) await api.patch(root+`/resources/${section}/${editor.row.id}`,{ ...body,rowVersion:editor.row.rowVersion });
    else await api.post(root+(section === 'capabilities' ? '/capabilities' : `/versions/${versionId}/${section}`),body);
    setEditor(null); refresh();
  }
  const fields = editor?.kind === 'pack' ? [
    { key:'applicationId',label:'Application',required:true,submit:false,options:applications.map(application => ({ value:application.id,label:`${application.name} (${application.code})` })) },
    ...packFields,
  ] : editor?.kind === 'pack-edit' ? packFields.filter(field => field.key !== 'code') : editor?.kind === 'pack-duplicate' ? packFields : ['version','clone'].includes(editor?.kind) ? versionFields(applications.filter(application => !pack?.applicationId || application.id === pack.applicationId),applicationVersions,loadingApplicationVersions) : resourceFields(editor?.kind === 'attach' ? 'attach' : section,version,data?.capabilities ?? []).filter(field => !editor?.row || editor.kind === 'attach' || !['code','moduleId','targetType','targetId','sourceType','sourceId','targetRef'].includes(field.key));
  const rows = !data ? [] : section === 'packs' ? data.packs : section === 'versions' ? pack?.versions ?? [] : section === 'capabilities' ? data.capabilities : section === 'registry' ? data.registry : ['modules','features','dependencies','rules'].includes(section) ? version?.[section] ?? [] : [];
  const visible = [...rows].filter(r => (!filter || r.status === filter) && [r.code,r.name,r.versionNumber,r.sourceId,r.targetRef].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'name' ? (a.name ?? a.versionNumber ?? '').localeCompare(b.name ?? b.versionNumber ?? '') : String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')));
  const editorButton = section === 'packs' ? 'pack' : section === 'versions' ? 'version' : ['modules','features','capabilities','dependencies','rules'].includes(section) ? section : null;
  const createPermission = section === 'packs' ? 'pack.create' : section === 'versions' ? 'pack.version.create' : `pack.${section === 'capabilities' ? 'capability' : section === 'dependencies' ? 'dependency' : section === 'rules' ? 'rule' : section === 'features' ? 'feature' : 'module'}.create`;
  const appVersionSelector = ({ value,onChange }) => <ApplicationVersionSelect value={value} onChange={onChange} versions={applicationVersions} loading={loadingApplicationVersions}/>;
  const versions = pack?.versions ?? [];
  const publishedVersions = versions.filter(item => item.status === 'PUBLISHED').sort((a,b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')));
  const recentPublications = pack ? publishedVersions.slice(0,5) : (data?.registry ?? []).slice(0,5);
  const selectedVersionEvents = [
    version?.createdAt && { action:'Version créée',createdAt:version.createdAt },
    version?.validatedAt && { action:'Validation exécutée',createdAt:version.validatedAt },
    version?.snapshot?.createdAt && { action:'Snapshot créé',createdAt:version.snapshot.createdAt },
    version?.manifest?.createdAt && { action:'Manifest généré',createdAt:version.manifest.createdAt },
    version?.publishedAt && { action:'Version publiée',createdAt:version.publishedAt },
  ].filter(Boolean);
  const contextIds = new Set([packId,versionId].filter(Boolean));
  const auditEvents = (data?.dashboard?.activity ?? []).filter(item => contextIds.has(item.targetId));
  const historyEvents = [...selectedVersionEvents,...auditEvents].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const snapshotContent = version?.snapshot?.content ?? version?.manifest?.content?.definition ?? {};
  const declaredRequirements = snapshotContent.requirements ?? {};
  const canPublish = version?.status === 'READY' && version?.manifestStatus === 'VALID' && version?.validationStatus === 'VALID';
  const manifestContent = version?.manifest?.content;
  const manifestReferencesMatch = Boolean(version?.manifest && version?.snapshot &&
    version.manifest.manifestHash === version.manifestHash &&
    version.snapshot.snapshotHash === version.snapshotHash &&
    manifestContent?.snapshotHash === version.snapshotHash);

  return <BmPage>
    <BmBreadcrumb items={[{ label:'Pack Manager',to:'/packs' },{ label:sections.find(([id]) => id === section)?.[1] ?? 'Vue d’ensemble' }]}/>
    <BmPageHeader
      title={sections.find(([id]) => id === section)?.[1] ?? 'Pack Manager'}
      subtitle="Composition, validation et publication des packs métier."
      actions={editorButton && allowed(createPermission) && (section === 'packs' || section === 'capabilities' || section === 'versions' && pack || mutable) &&
        <BmButton icon={<Plus size={16}/>} onClick={() => editorButton === 'version' ? openVersionEditor('version') : editorButton === 'pack' ? openPackEditor() : setEditor({ kind:editorButton })}>
          Créer {section === 'packs' ? 'un pack' : section === 'versions' ? 'une version' : 'un élément'}
        </BmButton>}
    />
    {error?.startsWith('Accès refusé') ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
      <h2 className="font-semibold">403 — Permission refusée</h2>
      <p className="mt-1 text-sm">{error}</p>
    </div> : error && <BmErrorState message={error} onRetry={refresh}/>}
    {!data ? (!error && <BmLoading/>) : <>
      <BmContextBar items={[
        { label:'Pack',value:pack?.name },
        { label:'Version',value:version?.versionNumber },
        { label:'Statut',value:version ? <BmStatusBadge value={version.status}/> : null },
        { label:'Application Version',value:version?.applicationVersion ? `${version.applicationVersion.application.name} · ${version.applicationVersion.version} (${version.applicationVersion.status})` : null },
        { label:'Tenant',value:tenant?.name ?? tenant?.id },
      ]}/>
      {pack && <div className="flex flex-wrap gap-3">
        <BmSelect label="Pack" value={packId} onChange={value => context(value)} options={[{ value:'',label:'Choisir un pack' },...data.packs.map(item => ({ value:item.id,label:item.name }))]}/>
        <BmSelect label="Version du pack" value={versionId} onChange={value => context(packId,value)} options={[{ value:'',label:'Choisir une version' },...versions.map(item => ({ value:item.id,label:`${item.versionNumber} · ${item.status} · ${item.validationStatus} · App ${item.applicationVersion?.version ?? '—'} (${item.applicationVersion?.status ?? '—'}) · ${new Date(item.updatedAt ?? item.createdAt).toLocaleDateString()}` }))]}/>
      </div>}
      {pack && <div className="space-y-2">
        <BmTabs ariaLabel="Sections du workspace pack" tabs={workspaceSections.map(([id,label]) => ({ id,label }))} active={workspaceSections.some(([id]) => id === section) ? section : 'overview'} onChange={id => navigate(link(id))}/>
        {compositionSections.some(([id]) => id === section) && <BmTabs ariaLabel="Composition du pack" tabs={compositionSections.map(([id,label]) => ({ id,label }))} active={section} onChange={id => navigate(link(id))}/>}
      </div>}
      {version?.status === 'PUBLISHED' && <div role="status" className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
        <div><strong>PUBLISHED — lecture seule</strong><p className="mt-1">Cette version publiée est immuable. Créez une nouvelle version pour apporter des changements.</p></div>
        <div className="flex flex-wrap gap-2">
          {allowed('pack.version.create') && <BmButton variant="secondary" onClick={() => openVersionEditor('clone')}>Créer la version suivante</BmButton>}
          <BmButton variant="secondary" onClick={() => navigate(link('manifest'))}>Voir le manifest</BmButton>
          <Link className="rounded-lg px-3 py-2 font-medium text-blue-700 hover:bg-white" to={`/runtime/context?pack=${encodeURIComponent(pack.code)}&packVersion=${encodeURIComponent(version.versionNumber)}`}>Ouvrir dans Runtime</Link>
        </div>
      </div>}
      {editor && ['version','clone'].includes(editor.kind) && selectedApplicationId && (loadingApplicationVersions || applicationVersions.length > 0 || !error) && <p role="status" className="text-sm text-slate-600">
        {loadingApplicationVersions ? 'Chargement des versions applicatives…' : applicationVersions.length ? `${applicationVersions.length} version(s) applicative(s) admissible(s).` : 'Aucune ApplicationVersion admissible pour cette application.'}
      </p>}
      {editor && ['version','clone'].includes(editor.kind) && selectedApplicationId && !error && !loadingApplicationVersions && !applicationVersions.length && <Link className="-mt-3 inline-block text-sm font-semibold text-blue-700" to="/business-manager/applications">Ouvrir Business Manager pour préparer une ApplicationVersion →</Link>}
      {editor && <BMResourceEditor
        key={editor.kind + (editor.row?.id ?? '')}
        fields={fields.map(field => field.key === 'expression'
          ? { ...field,label:'Conditions',render:props => <RuleConditionEditor {...props}/> }
          : field.key === 'applicationVersionId'
            ? { ...field,render:appVersionSelector }
            : field)}
        initial={editor.kind === 'pack-edit' ? pack : editor.kind === 'clone' ? { applicationId:selectedApplicationId } : editor.row ?? {}}
        onSave={save}
        onCancel={() => setEditor(null)}
        onFieldChange={(key,value) => {
          if (key === 'applicationId') { setSelectedApplicationId(value); setApplicationVersions([]); }
        }}
      />}
      {editor?.kind === 'pack' && <p className="-mt-3 text-xs text-slate-500">L’application sélectionnée sera rattachée au pack lors de la création de sa première version.</p>}

      {section === 'overview' && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <BmKpiCard label="Packs" value={data.dashboard.counters.packs} icon={createElement(Package,{ size:22 })}/>
          <BmKpiCard label="Versions en préparation" value={data.dashboard.counters.drafts} icon={createElement(Layers,{ size:22 })}/>
          <BmKpiCard label="Prêtes (pack sélectionné)" value={pack ? versions.filter(item => item.status === 'READY').length : '—'} hint={pack ? pack.name : 'Sélectionnez un pack'} icon={createElement(FileCheck2,{ size:22 })}/>
          <BmKpiCard label="Versions publiées" value={data.dashboard.counters.published} icon={createElement(Rocket,{ size:22 })}/>
          <BmKpiCard label="Erreurs de validation" value={data.dashboard.counters.attention} icon={createElement(ShieldCheck,{ size:22 })}/>
        </div>
        <IntegrationFlow version={version} pack={pack}/>
        {pack ? <BmCard title={`Workspace — ${pack.name}`} subtitle={pack.description || `Pack ${pack.code}`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryValue label="Application" value={pack.applicationId ?? 'Associée à la première version'}/>
            <SummaryValue label="Versions" value={versions.length}/>
            <SummaryValue label="Dernière validation" value={version?.validationStatus ?? 'Non exécutée'}/>
            <SummaryValue label="Dernière publication" value={publishedVersions[0]?.publishedAt ? new Date(publishedVersions[0].publishedAt).toLocaleString() : 'Aucune'}/>
          </div>
          <p className="mt-4 text-sm text-slate-500">Choisissez une version pour consulter sa composition, ses exigences et ses artefacts.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BmButton variant="secondary" onClick={() => navigate(link('versions'))}>Versions</BmButton>
            {version && <BmButton variant="secondary" onClick={() => navigate(link('validation'))}>Validation</BmButton>}
          </div>
        </BmCard> : <BmCard title="De la définition à l’exécution">
          <ol className="flex flex-wrap gap-3 text-sm text-slate-600">{['DRAFT','CONFIGURING','VALIDATION','READY','MANIFEST','PUBLISHED'].map(status => <li key={status} className="rounded-lg border px-3 py-2"><BmStatusBadge value={status}/></li>)}</ol>
          <p className="mt-4 text-sm text-slate-500">Sélectionnez un pack pour ouvrir son workspace et consulter ses versions.</p>
          <Link className="text-sm text-blue-700" to={link('packs')}>Ouvrir le catalogue →</Link>
        </BmCard>}
        <div className="grid gap-5 xl:grid-cols-2">
          <BmCard title="Activité récente">
            {data.dashboard.activity.length ? <ul className="divide-y divide-slate-100">{data.dashboard.activity.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{item.action}</span><time className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></li>)}</ul> : <BmEmptyState title="Aucune activité enregistrée"/>}
          </BmCard>
          <BmCard title={pack ? 'Publications récentes du pack' : 'Publications récentes'}>
            {recentPublications.length ? <ul className="divide-y divide-slate-100">{recentPublications.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{item.name ?? pack?.name ?? item.code} {item.versionNumber}</strong><span className="ml-2 text-slate-500">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Date indisponible'}</span></span><BmStatusBadge value="PUBLISHED"/></li>)}</ul> : <BmEmptyState title="Aucune publication enregistrée"/>}
          </BmCard>
        </div>
      </>}

      {section === 'packs' && <>
        <div className="flex flex-wrap gap-3"><BmSearchInput value={search} onChange={setSearch} placeholder="Rechercher un pack"/><BmSelect label="Filtrer par statut" value={filter} onChange={setFilter} options={[{ value:'',label:'Tous les statuts' },...Array.from(new Set(data.packs.map(item => item.status).filter(Boolean))).map(status => ({ value:status,label:status }))]}/></div>
        <BmTable rows={visible} emptyState={<BmEmptyState title="Aucun pack" description="Créez un pack ou modifiez la recherche."/>} columns={[
          { key:'pack',label:'Pack',render:item => <div><strong>{item.name}</strong><p className="text-xs text-slate-500">{item.code}</p></div> },
          { key:'application',label:'Application',render:item => item.id === packId ? (version?.applicationVersion?.application?.name ?? item.applicationId ?? 'À associer à la création de version') : item.applicationId ?? 'À associer à la création de version' },
          { key:'currentVersion',label:'Version courante',render:item => item.id === packId ? (publishedVersions[0]?.versionNumber ?? '—') : '—' },
          { key:'draftVersion',label:'Version brouillon',render:item => item.id === packId ? (versions.find(candidate => ['DRAFT','CONFIGURING','READY'].includes(candidate.status))?.versionNumber ?? '—') : '—' },
          { key:'status',label:'Statut',render:item => <BmStatusBadge value={item.status}/> },
          { key:'validation',label:'Dernière validation',render:item => item.id === packId ? (version?.validationStatus ?? '—') : '—' },
          { key:'publication',label:'Dernière publication',render:item => item.id === packId && publishedVersions[0]?.publishedAt ? new Date(publishedVersions[0].publishedAt).toLocaleDateString() : '—' },
          { key:'actions',label:'Actions',render:item => <BmButton size="sm" variant="secondary" onClick={() => { context(item.id); navigate('/packs/overview?pack='+item.id+'&version='); }}>Ouvrir</BmButton> },
        ]}/>
        {pack && allowed('pack.update') && <div className="flex flex-wrap gap-2">
          {allowed('pack.create') && <BmButton variant="secondary" onClick={() => setEditor({ kind:'pack-duplicate' })}>Dupliquer la définition</BmButton>}
          <BmButton variant="secondary" onClick={() => setEditor({ kind:'pack-edit' })}>Modifier {pack.name}</BmButton>
          {allowed(pack.archivedAt ? 'pack.restore' : 'pack.archive') && <BmButton variant={pack.archivedAt ? 'secondary' : 'danger'} disabled={busy} onClick={() => setConfirmation({ title:pack.archivedAt ? 'Restaurer ce pack' : 'Archiver ce pack',message:pack.archivedAt ? `Le pack ${pack.name} sera de nouveau disponible.` : `Le pack ${pack.name} ne sera plus modifiable.`,confirmLabel:pack.archivedAt ? 'Restaurer' : 'Archiver',danger:!pack.archivedAt,perform:() => api.post(root+`/packs/${packId}/${pack.archivedAt ? 'restore' : 'archive'}`) })}>{pack.archivedAt ? 'Restaurer' : 'Archiver'}</BmButton>}
        </div>}
      </>}

      {section === 'versions' && (pack ? <BmCard title="Versions du pack" subtitle="Chaque version est liée à une ApplicationVersion du tenant actif.">
        <BmTable rows={versions} emptyState={<BmEmptyState title="Aucune version" description="Créez une version et sélectionnez une ApplicationVersion admissible."/>} columns={[
          { key:'versionNumber',label:'Version',render:item => <div><strong>{item.versionNumber}</strong>{item.label && <p className="text-xs text-slate-500">{item.label}</p>}</div> },
          { key:'applicationVersion',label:'Application Version',render:item => item.applicationVersion ? `${item.applicationVersion.application?.name ?? item.applicationVersion.applicationId} · ${item.applicationVersion.version}` : 'Non renseignée' },
          { key:'status',label:'Statut',render:item => <BmStatusBadge value={item.status}/> },
          { key:'validationStatus',label:'Validation',render:item => <BmStatusBadge value={item.validationStatus}/> },
          { key:'snapshot',label:'Snapshot',render:item => item.snapshotHash ? <span title={item.snapshotHash}>Disponible · {item.snapshotHash.slice(0,16)}…</span> : '—' },
          { key:'manifest',label:'Manifest',render:item => item.manifestHash ? <span title={item.manifestHash}>{item.manifestStatus} · {item.manifestHash.slice(0,16)}…</span> : item.manifestStatus ?? '—' },
          { key:'publishedAt',label:'Publié',render:item => item.publishedAt ? new Date(item.publishedAt).toLocaleString() : '—' },
          { key:'actions',label:'Actions',render:item => <BmButton size="sm" variant="secondary" onClick={() => { context(packId,item.id); navigate('/packs/overview?pack='+packId+'&version='+item.id); }}>Ouvrir</BmButton> },
        ]}/>
        {version && allowed('pack.version.create') && <BmButton variant="secondary" onClick={() => openVersionEditor('clone')}>Cloner la version {version.versionNumber}</BmButton>}
      </BmCard> : <BmEmptyState title="Sélectionnez un pack"/> )}

      {section === 'requirements' && (version ? <RequirementsView definition={snapshotContent} requirements={declaredRequirements}/> : <BmEmptyState title="Sélectionnez une version"/> )}

      {section === 'validation' && (version ? <BmCard title="Cockpit de validation" subtitle={`Version ${version.versionNumber} · ${version.applicationVersion?.application?.name ?? 'Application'} ${version.applicationVersion?.version ?? ''}`}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <BmStatusBadge value={version.validationStatus}/>
          {mutable && allowed('pack.version.validate') && <BmButton disabled={busy} onClick={() => action(`/versions/${versionId}/validate`)}>Valider</BmButton>}
          <SnapshotIntegrity version={version}/>
        </div>
        <ValidationDetails versionId={versionId} revision={revision} link={link}/>
      </BmCard> : <BmEmptyState title="Choisissez une version à valider"/> )}

      {section === 'manifest' && (version ? <div className="space-y-5">
        <BmCard title="Snapshot immuable" subtitle="Vue en lecture seule de l’instantané validé.">
          {version.snapshot ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryValue label="Snapshot ID" value={version.snapshot.id}/>
            <SummaryValue label="Créé le" value={new Date(version.snapshot.createdAt).toLocaleString()}/>
            <SummaryValue label="ApplicationVersion source" value={version.applicationVersionId}/>
            <SummaryValue label="Hash du snapshot" value={version.snapshot.snapshotHash}/>
          </div> : <p className="text-sm text-slate-500">Aucun snapshot : une validation réussie est nécessaire.</p>}
          {version.snapshot && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-blue-700">Sources et composition du snapshot</summary><pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-50 p-4 text-xs">{JSON.stringify(version.snapshot.content,null,2)}</pre></details>}
        </BmCard>
        <BmCard title="Manifest" subtitle="Artefact généré depuis le snapshot validé, sans secret.">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <BmStatusBadge value={version.manifestStatus}/>
            {mutable && version.validationStatus === 'VALID' && allowed('pack.version.generate.manifest') && <BmButton disabled={busy} variant="secondary" onClick={() => action(`/versions/${versionId}/manifest`)}>Générer le manifest</BmButton>}
            {version.status === 'PUBLISHED' && <Link className="text-sm font-semibold text-blue-700" to={`/runtime/context?pack=${encodeURIComponent(pack.code)}&packVersion=${encodeURIComponent(version.versionNumber)}`}>Déployer →</Link>}
          </div>
          {version.manifest ? <>
            <BmTabs ariaLabel="Affichage du manifest" tabs={[{ id:'structured',label:'Structuré' },{ id:'json',label:'JSON' },{ id:'compatibility',label:'Compatibilité' },{ id:'integrity',label:'Intégrité' }]} active={manifestPanel} onChange={setManifestPanel}/>
            {manifestPanel === 'structured' && <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <SummaryValue label="Pack" value={version.manifest.content.definition?.pack?.name ?? pack.name}/>
              <SummaryValue label="PackVersion" value={version.versionNumber}/>
              <SummaryValue label="ApplicationVersion" value={version.manifest.content.definition?.ui?.applicationVersionId ?? version.applicationVersionId}/>
              <SummaryValue label="Version du contrat" value={version.manifest.contractVersion}/>
              <SummaryValue label="Schema UI" value={version.manifest.content.definition?.ui?.schemaVersion ?? 'Non déclarée'}/>
              <SummaryValue label="Manifest hash" value={version.manifest.manifestHash}/>
              <SummaryValue label="Modules / fonctionnalités" value={`${version.manifest.content.definition?.modules?.length ?? 0} / ${version.manifest.content.definition?.features?.length ?? 0}`}/>
            </div>}
            {manifestPanel === 'json' && <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(version.manifest.content,null,2)}</pre>}
            {manifestPanel === 'compatibility' && <div className="space-y-3 pt-4 text-sm">
              <SummaryValue label="Contrat" value={version.manifest.content.contract ?? '—'}/>
              <SummaryValue label="Version du contrat" value={version.manifest.contractVersion}/>
              <SummaryValue label="ApplicationVersion embarquée" value={version.manifest.content.definition?.ui?.applicationVersionId ?? 'Non exposée dans le contenu UI'}/>
              <p className="text-slate-500">Compatibilité indiquée par les métadonnées du contrat. Aucun résultat de compatibilité non calculé n’est affiché.</p>
            </div>}
            {manifestPanel === 'integrity' && <div className="space-y-3 pt-4">
              <p role="status" className={manifestReferencesMatch ? 'text-sm font-medium text-emerald-700' : 'text-sm font-medium text-amber-700'}>{manifestReferencesMatch ? 'Les références snapshot/manifest sont cohérentes.' : 'Les références snapshot/manifest ne sont pas complètes ou ne correspondent pas.'}</p>
              <SummaryValue label="Snapshot hash" value={version.snapshotHash ?? '—'}/>
              <SummaryValue label="Manifest hash" value={version.manifestHash ?? '—'}/>
              <p className="text-xs text-slate-500">Le serveur revérifie les hashes et la définition courante au moment de publier.</p>
            </div>}
          </> : <p className="text-sm text-slate-500">Aucun manifest généré. Une validation réussie est nécessaire.</p>}
        </BmCard>
      </div> : <BmEmptyState title="Sélectionnez une version"/> )}

      {section === 'publication' && (version ? <BmCard title="Revue de publication" subtitle="La publication réexécute les contrôles côté serveur et rend la version immuable.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryValue label="Pack / PackVersion" value={`${pack.name} · ${version.versionNumber}`}/>
          <SummaryValue label="ApplicationVersion" value={`${version.applicationVersion?.application?.name ?? '—'} · ${version.applicationVersion?.version ?? '—'}`}/>
          <SummaryValue label="Validation" value={<BmStatusBadge value={version.validationStatus}/>}/>
          <SummaryValue label="Snapshot" value={version.snapshot ? version.snapshot.snapshotHash : 'Absent'}/>
          <SummaryValue label="Manifest" value={version.manifest ? version.manifest.manifestHash : 'Absent'}/>
          <SummaryValue label="Dépendances" value={version.dependencies?.length ?? 0}/>
        </div>
        {version.dependencies?.length > 0 && <ul className="mt-4 space-y-2" aria-label="Dépendances à publier">{version.dependencies.map(dependency => <li key={dependency.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"><strong>{dependency.sourceType} {dependency.sourceId}</strong> → {dependency.targetType} {dependency.targetRef} <span className="text-slate-500">{dependency.targetVersionRange ?? ''}</span></li>)}</ul>}
        {version.validationStatus !== 'VALID' && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Publication bloquée</strong><p className="mt-1">La validation n’est pas valide. Consultez le cockpit avant toute publication.</p></div>}
        {version.status === 'PUBLISHED' ? <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <strong>Publié le {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : 'date indisponible'}</strong>
          <p className="mt-1">Cette version est immuable. Hash du manifest : <span className="break-all">{version.manifestHash ?? '—'}</span></p>
          <Link className="mt-3 inline-block font-semibold text-blue-700" to={`/runtime/context?pack=${encodeURIComponent(pack.code)}&packVersion=${encodeURIComponent(version.versionNumber)}`}>Déployer →</Link>
        </div> : <div className="mt-5 flex flex-wrap items-center gap-3">
          {canPublish ? <BmButton disabled={busy || !allowed('pack.version.publish')} onClick={() => setConfirmation({ title:'Publier cette version',message:`${pack.name} ${version.versionNumber} deviendra immuable après publication.`,confirmLabel:'Publier',danger:false,perform:() => api.post(root+`/versions/${versionId}/publish`) })}>Publier</BmButton> : <p className="text-sm text-amber-800">Publication indisponible : validation réussie et manifest valide requis.</p>}
          <Link className="text-sm text-blue-700" to={link('validation')}>Consulter la validation</Link>
          <Link className="text-sm text-blue-700" to={link('manifest')}>Consulter le manifest</Link>
        </div>}
      </BmCard> : <BmEmptyState title="Sélectionnez une version"/> )}

      {section === 'history' && (version ? <div className="space-y-5">
        <BmCard title="Historique des publications" subtitle="Versions publiées du pack, avec leur auteur, leur date et leur empreinte.">
          {publishedVersions.length ? <div className="space-y-3">{publishedVersions.map(item => <div key={item.id} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-4">
            <span><strong>{item.versionNumber}</strong> · <BmStatusBadge value={item.status}/></span>
            <span>{item.publishedBy ?? 'Auteur indisponible'}</span>
            <time>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Date indisponible'}</time>
            <span className="break-all font-mono text-xs">{item.manifestHash ?? 'Hash indisponible'}</span>
          </div>)}</div> : <BmEmptyState title="Aucune publication enregistrée"/>}
        </BmCard>
        <BmCard title="Historique de la version" subtitle="Événements issus des horodatages et de l’activité récente disponible pour le tenant.">
          {historyEvents.length ? <ol className="space-y-4">{historyEvents.map((item,index) => <li key={`${item.id ?? item.action}-${item.createdAt}-${index}`} className="flex gap-3 text-sm">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true"/>
            <div><strong>{item.action}</strong><time className="mt-1 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>{item.targetId && <p className="mt-1 break-all text-xs text-slate-500">Référence : {item.targetId}</p>}</div>
          </li>)}</ol> : <BmEmptyState title="Aucun événement disponible"/>}
          <p className="mt-4 text-xs text-slate-500">L’activité affichée est limitée aux événements récents renvoyés par le service Pack Manager.</p>
        </BmCard>
      </div> : <BmEmptyState title="Sélectionnez une version"/> )}

      {['modules','features','capabilities','dependencies','rules','registry'].includes(section) && <>
        {section !== 'registry' && !version && !['capabilities'].includes(section) ? <BmEmptyState title="Sélectionnez une version"/> : <>
          <div className="flex flex-wrap gap-3"><BmSearchInput value={search} onChange={setSearch}/><BmSelect label="Filtrer par statut" value={filter} onChange={setFilter} options={[{ value:'',label:'Tous les statuts' },...Array.from(new Set(rows.map(item => item.status).filter(Boolean))).map(status => ({ value:status,label:status }))]}/><BmSelect label="Trier" value={sort} onChange={setSort} options={[{ value:'updated',label:'Modification récente' },{ value:'name',label:'Nom / version' }]}/></div>
          <BmTable rows={visible} emptyState={<BmEmptyState title="Aucun élément" description="Créez un élément ou ajustez les filtres."/>} columns={[
            { key:'name',label:'Nom / référence',render:item => <div><span className="font-semibold">{item.name ?? item.versionNumber ?? item.sourceId}</span><p className="text-xs text-slate-500">{item.code ?? item.targetRef ?? item.label}</p></div> },
            { key:'status',label:'Statut',render:item => <BmStatusBadge value={item.status ?? item.resolutionStatus ?? (item.enabled === false ? 'INACTIVE' : item.relationType)}/> },
            { key:'details',label:'Détails',render:item => section === 'dependencies' ? `${item.dependencyType} → ${item.targetRef} ${item.targetVersionRange ?? ''}` : section === 'rules' ? `${item.effect} · ${item.targetId} · priorité ${item.priority}` : section === 'features' ? (item.capabilities ?? []).map(linkItem => `${linkItem.relationType}: ${linkItem.capability.code}`).join(', ') : item.validationStatus ?? item.description ?? '—' },
            { key:'actions',label:'Actions',render:item => <div className="flex flex-wrap gap-2">
              {section === 'registry' ? <Link className="text-blue-700" to={`/runtime/context?pack=${encodeURIComponent(item.code)}&packVersion=${encodeURIComponent(item.versionNumber)}`}>Ouvrir dans Runtime</Link> :
                section === 'capabilities' && allowed('pack.capability.update') ? <BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:section,row:item })}>Modifier</BmButton> :
                mutable && allowed('pack.update') ? <><BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:section,row:item })}>Modifier</BmButton><BmButton size="sm" variant="danger" disabled={busy} onClick={() => setConfirmation({ title:'Archiver cet élément',message:'Cet élément ne pourra plus être modifié dans cette version.',confirmLabel:'Archiver',danger:true,perform:() => api.patch(root+`/resources/${section}/${item.id}`,{ rowVersion:item.rowVersion,archived:true }) })}>Archiver</BmButton>{section === 'features' && allowed('pack.capability.attach') && <BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:'attach',row:item })}>Associer une capacité</BmButton>}</> : null}
            </div> },
          ]}/>
        </>}
      </>}
    </>}
    <ConfirmModal open={Boolean(confirmation)} title={confirmation?.title} message={confirmation?.message} confirmLabel={confirmation?.confirmLabel} danger={confirmation?.danger} loading={busy} onConfirm={confirmAction} onCancel={() => { if (!busy) setConfirmation(null); }}/>
  </BmPage>;
}

function SummaryValue({ label,value }) {
  return <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 break-all text-sm font-medium text-slate-800">{value ?? '—'}</div></div>;
}

function IntegrationFlow({ version,pack }) {
  const definition = version?.snapshot?.content ?? version?.manifest?.content?.definition ?? {};
  const published = version?.status === 'PUBLISHED';
  const steps = [
    { name:'Business Manager',status:version?.applicationVersion?.status ?? 'NON SÉLECTIONNÉ',detail:version?.applicationVersion ? `${version.applicationVersion.application?.name ?? pack?.applicationId ?? 'Application'} · ${version.applicationVersion.version}` : 'Aucune ApplicationVersion sélectionnée' },
    { name:'UI Builder',status:definition.ui ? 'INCLUS AU SNAPSHOT' : 'NON DÉCLARÉ',detail:definition.ui?.applicationVersionId ?? 'Aucune définition UI embarquée' },
    { name:'Automation',status:definition.automation ? 'INCLUS AU SNAPSHOT' : 'NON DÉCLARÉ',detail:definition.automation ? 'Définition incluse dans le snapshot' : 'Aucune définition Automation déclarée' },
    { name:'Pack Manager',status:version?.status ?? 'EN ATTENTE',detail:version ? `Version ${version.versionNumber} · validation ${version.validationStatus}` : 'Sélectionnez une version pour consulter son état' },
    { name:'Deployment',status:published ? 'PUBLICATION DISPONIBLE' : 'NON PUBLIÉ',detail:published ? 'Une version immuable est prête au déploiement' : 'La publication est nécessaire avant le déploiement' },
    { name:'Runtime',status:published ? 'MANIFEST PUBLIÉ' : 'EN ATTENTE',detail:published ? version.manifestHash ?? 'Manifest publié' : 'Aucun manifest publié pour cette version' },
  ];
  return <BmCard title="Flux d’intégration" subtitle="Vue en lecture seule des sources et de la publication ; les états non déclarés ne sont pas simulés.">
    <ol aria-label="Étapes du flux d’intégration" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {steps.map((step,index) => <li key={step.name} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{index + 1}. {step.name}</strong><BmStatusBadge value={step.status}/></div>
        <p className="mt-2 break-words text-xs text-slate-600">{step.detail}</p>
      </li>)}
    </ol>
  </BmCard>;
}

export function ApplicationVersionSelect({ value,onChange,versions,loading }) {
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('');
  const visible = versions.filter(item => (!status || item.status === status) && `${item.version} ${item.status} ${item.validationStatus ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const statuses = [...new Set(versions.map(item => item.status))].sort();
  return <div className="space-y-2">
    <input type="search" aria-label="Rechercher une ApplicationVersion" placeholder="Rechercher par version ou statut" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-300" value={search} onChange={event => setSearch(event.target.value)}/>
    <select aria-label="Filtrer les ApplicationVersions par statut" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-300" value={status} onChange={event => setStatus(event.target.value)}>
      <option value="">Tous les statuts</option>{statuses.map(item => <option key={item} value={item}>{item}</option>)}
    </select>
    <select aria-label="Application Version" required disabled={loading} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-300" value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Sélectionner une ApplicationVersion</option>{visible.map(item => <option key={item.id} value={item.id}>{item.version} · {item.status}{item.validationStatus ? ` · Validation ${item.validationStatus}` : ''}{item.updatedAt ? ` · ${new Date(item.updatedAt).toLocaleDateString()}` : item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}</option>)}
    </select>
    {!loading && !visible.length && <p className="text-xs text-slate-500">Aucune ApplicationVersion ne correspond à ce filtre.</p>}
  </div>;
}

function RequirementsView({ definition,requirements }) {
  const capabilities = (definition.features ?? []).flatMap(feature => (feature.capabilities ?? []).map(capability => ({ ...capability,feature:feature.code })));
  const groups = [
    ['Runtime',requirements.runtime],
    ['Data',requirements.data],
    ['Integration',requirements.integration],
    ['Capabilities',requirements.capabilities ?? capabilities],
    ['Schema versions',requirements.schemaVersions],
  ];
  return <div className="grid gap-5 md:grid-cols-2">
    {groups.map(([label,items]) => <BmCard key={label} title={label}>
      {Array.isArray(items) && items.length ? <ul className="space-y-2">{items.map((item,index) => <li key={item.id ?? item.code ?? index} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul> : <BmEmptyState title="Aucune exigence déclarée"/>}
    </BmCard>)}
  </div>;
}

function SnapshotIntegrity({ version }) {
  const valid = Boolean(version.snapshot && version.snapshotHash && version.snapshot.snapshotHash === version.snapshotHash);
  return <span className={valid ? 'text-sm text-emerald-700' : 'text-sm text-amber-700'}>{valid ? 'Snapshot cohérent' : 'Snapshot absent ou à revalider'}</span>;
}

function ValidationDetails({ versionId,revision,link }) {
  const [state,setState] = useState({ loading:true });
  useEffect(() => { let live = true; setState({ loading:true }); get(`/versions/${versionId}/validation`).then(data => { if (live) setState({ data }); }).catch(error => { if (live) setState({ error:requestError(error,'Impossible de charger la validation.') }); }); return () => { live = false; }; },[versionId,revision]);
  if (state.loading) return <BmLoading/>;
  if (state.error) return <BmErrorState message={state.error}/>;
  if (!state.data) return <p className="text-sm text-slate-500">Aucune validation exécutée.</p>;
  const targetFor = issue => {
    const path = String(issue.path ?? '').toLowerCase();
    return ['modules','features','dependencies','rules'].find(section => path.startsWith(section)) ?? 'validation';
  };
  return <div>
    <p className="mb-3 text-sm">Dernière validation : <BmStatusBadge value={state.data.status}/> · {new Date(state.data.createdAt).toLocaleString()}</p>
    {state.data.issues.length ? <ul className="space-y-2">{state.data.issues.map((issue,index) => <li key={`${issue.code}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <strong>{issue.code}</strong> — {issue.message}<p className="mt-1 text-xs text-slate-600">Chemin : {issue.path}</p>
      <Link className="mt-2 inline-block text-xs font-semibold text-blue-700" to={link(targetFor(issue))}>Ouvrir la section concernée →</Link>
    </li>)}</ul> : <p className="text-sm text-emerald-700">Les contrôles exécutés ne signalent aucune erreur.</p>}
  </div>;
}
