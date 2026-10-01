import RuleConditionEditor from './RuleConditionEditor.jsx';
import { createElement, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, Layers, ShieldCheck, Rocket } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { BmPage, BmPageHeader, BmBreadcrumb, BmContextBar, BmCard, BmKpiCard, BmButton, BmTabs, BmTable, BmStatusBadge, BmEmptyState, BmErrorState, BmLoading, BmSearchInput, BmSelect } from '../business-manager/bm/ui.jsx';
import { BMResourceEditor } from '../business-manager/BMResourceEditor.jsx';
import { packFields, versionFields, resourceFields } from './packFields.js';

const root = '/pack-manager';
const get = path => api.get(root + path).then(r => r.data);
const sections = [['overview',"Vue d’ensemble"],['packs','Packs'],['versions','Versions'],['modules','Modules'],['features','Fonctionnalités'],['capabilities','Capacités'],['dependencies','Dépendances'],['rules','Règles'],['validation','Validation & Manifest'],['publication','Publication'],['registry','Registry']];
export default function PackManagerPage() { const { activeTenant } = useTenant(); return <Workspace key={activeTenant?.id} tenant={activeTenant}/>; }
function Workspace({ tenant }) {
  const { pathname } = useLocation(), navigate = useNavigate(), [query,setQuery] = useSearchParams();
  const { user } = useAuth();
  const allowed = permission => user?.isAdmin || user?.permissions?.includes('*') || user?.permissions?.includes(permission);
  const section = pathname === '/packs' ? 'overview' : pathname.split('/').pop();
  const storage = `pm-context:${tenant?.id}`;
  const [saved] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storage) || '{}'); } catch { return {}; } });
  const packId = query.get('pack') ?? saved.packId ?? '', versionId = query.get('version') ?? saved.versionId ?? '';
  const [data,setData] = useState(null), [error,setError] = useState(''), [busy,setBusy] = useState(false), [revision,setRevision] = useState(0), [editor,setEditor] = useState(null), [search,setSearch] = useState(''), [filter,setFilter] = useState(''), [sort,setSort] = useState('updated');
  const refresh = () => setRevision(r => r+1);
  useEffect(() => {
    if (data && section === 'packs' && query.get('create') === '1' && allowed('pack.create')) {
      setEditor({ kind:'pack' });
      const next = new URLSearchParams(query); next.delete('create'); setQuery(next,{ replace:true });
    }
  },[data,section,query]);
  useEffect(() => {
    let alive = true; setData(null); setError(''); setEditor(null);
    Promise.all([get('/dashboard'),get('/packs?limit=100'),get('/capabilities'),get('/registry'),packId ? get(`/packs/${packId}`) : null,versionId ? get(`/versions/${versionId}`) : null]).then(([dashboard,packs,capabilities,registry,pack,version]) => {
      if (version && version.packId !== pack?.id) throw new Error('Le contexte de version ne correspond pas au pack.');
      if (alive) setData({ dashboard,packs,capabilities,registry,pack,version });
    }).catch(e => { if (alive) setError(e.response?.status === 403 ? 'Accès refusé : permission Pack Manager requise.' : e.normalized?.message || e.message); });
    return () => { alive = false; };
  },[packId,versionId,revision]);
  function context(pack,version = '') { sessionStorage.setItem(storage,JSON.stringify({ packId:pack,versionId:version })); setQuery({ pack,version }); }
  const link = s => '/packs' + (s === 'overview' ? '' : '/' + s) + '?' + new URLSearchParams({ pack:packId,version:versionId });
  async function action(path,body = {}) { if (busy) return; setBusy(true); setError(''); try { await api.post(root+path,body); refresh(); } catch(e) { setError(e.normalized?.message || 'Opération refusée.'); } finally { setBusy(false); } }
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
  const fields = editor?.kind?.startsWith('pack') ? (editor.kind === 'pack-edit' ? packFields.filter(f => f.key !== 'code') : packFields) : ['version','clone'].includes(editor?.kind) ? versionFields : resourceFields(editor?.kind === 'attach' ? 'attach' : section,version,data?.capabilities ?? []).filter(f => !editor?.row || editor.kind === 'attach' || !['code','moduleId','targetType','targetId','sourceType','sourceId','targetRef'].includes(f.key));
  const rows = data ? (section === 'packs' ? data.packs : section === 'versions' ? pack?.versions ?? [] : section === 'capabilities' ? data.capabilities : section === 'registry' ? data.registry : version?.[section] ?? []) : [];
  const visible = [...rows].filter(r => (!filter || r.status === filter) && [r.code,r.name,r.versionNumber,r.sourceId,r.targetRef].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'name' ? (a.name ?? a.versionNumber ?? '').localeCompare(b.name ?? b.versionNumber ?? '') : String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')));
  const editorButton = section === 'packs' ? 'pack' : section === 'versions' ? 'version' : ['modules','features','capabilities','dependencies','rules'].includes(section) ? section : null;
  return <BmPage>
    <BmBreadcrumb items={[{ label:'Pack Manager',to:'/packs' },{ label:sections.find(([s]) => s === section)?.[1] }]}/>
    <BmPageHeader title={sections.find(([s]) => s === section)?.[1] ?? 'Pack Manager'} subtitle="Composition, validation et publication des packs métier." actions={editorButton && allowed('pack.create') && (['packs','capabilities'].includes(section) || section === 'versions' && pack || mutable) && <BmButton icon={<Plus size={16}/>} onClick={() => setEditor({ kind:editorButton })}>Créer {section === 'packs' ? 'un pack' : section === 'versions' ? 'une version' : 'un élément'}</BmButton>}/>
    {error && <BmErrorState message={error} onRetry={refresh}/>}
    {!data ? (!error && <BmLoading/>) : <>
      <BmContextBar items={[{ label:'Pack',value:pack?.name },{ label:'Version',value:version?.versionNumber },{ label:'Statut',value:version ? <BmStatusBadge value={version.status}/> : null },{ label:'Tenant',value:tenant?.name ?? tenant?.id }]}/>
      <div className="flex flex-wrap gap-3"><BmSelect label="Pack" value={packId} onChange={v => context(v)} options={[{ value:'',label:'Choisir un pack' },...data.packs.map(p => ({ value:p.id,label:p.name }))]}/>{pack && <BmSelect label="Version du pack" value={versionId} onChange={v => context(packId,v)} options={[{ value:'',label:'Choisir une version' },...pack.versions.map(v => ({ value:v.id,label:v.versionNumber + ' · ' + v.status }))]}/>}</div>
      {pack && <BmTabs tabs={sections.filter(([s]) => !['packs','registry'].includes(s)).map(([id,label]) => ({ id,label }))} active={section} onChange={s => navigate(link(s))}/>}
      {editor && <BMResourceEditor key={editor.kind + (editor.row?.id ?? '')} fields={fields.map(f => f.key === 'expression' ? { ...f,label:'Conditions',render:props => <RuleConditionEditor {...props}/> } : f)} initial={editor.kind === 'pack-edit' ? pack : editor.row ?? {}} onSave={save} onCancel={() => setEditor(null)}/>}
      {section === 'overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['packs','Packs',Package],['drafts','Versions en préparation',Layers],['published','Versions publiées',Rocket],['attention','Validation à corriger',ShieldCheck]].map(([k,label,icon]) => <BmKpiCard key={k} label={label} value={data.dashboard.counters[k]} icon={createElement(icon,{ size:22 })}/>)}</div><BmCard title="De la définition à l’exécution"><ol className="flex flex-wrap gap-3 text-sm text-slate-600">{['DRAFT','CONFIGURATION','VALIDATION','READY','MANIFEST','PUBLISHED'].map(s => <li key={s} className="rounded-lg border px-3 py-2"><BmStatusBadge value={s}/></li>)}</ol><p className="mt-4 text-sm text-slate-500">Sélectionnez un pack et sa version pour configurer son contenu.</p><Link className="text-blue-700 text-sm" to={link('packs')}>Ouvrir le catalogue →</Link></BmCard><BmCard title="Activité récente">{data.dashboard.activity.length ? <ul className="divide-y divide-slate-100">{data.dashboard.activity.map(a => <li key={a.id} className="py-3 text-sm flex flex-wrap justify-between gap-2"><span>{a.action}</span><time className="text-slate-500">{new Date(a.createdAt).toLocaleString()}</time></li>)}</ul> : <BmEmptyState title="Aucune activité enregistrée"/>}</BmCard></>}
      {['packs','versions','modules','features','capabilities','dependencies','rules','registry'].includes(section) && <>
        {!['packs','capabilities','registry'].includes(section) && !pack ? <BmEmptyState title="Sélectionnez un pack" description="Le contexte est conservé entre les écrans."/> : <><div className="flex flex-wrap gap-3"><BmSearchInput value={search} onChange={setSearch}/><BmSelect label="Filtrer par statut" value={filter} onChange={setFilter} options={[{ value:'',label:'Tous les statuts' },...Array.from(new Set(rows.map(r => r.status).filter(Boolean))).map(s => ({ value:s,label:s }))]}/><BmSelect label="Trier" value={sort} onChange={setSort} options={[{ value:'updated',label:'Modification récente' },{ value:'name',label:'Nom / version' }]}/></div>
        <BmTable rows={visible} emptyState={<BmEmptyState title="Aucun élément" description={version || ['packs','versions','capabilities','registry'].includes(section) ? 'Créez un élément ou ajustez les filtres.' : 'Choisissez une version pour afficher son contenu.'}/>} columns={[
          { key:'name',label:'Nom / référence',render:r => <div><span className="font-semibold">{r.name ?? r.versionNumber ?? r.sourceId}</span><p className="text-xs text-slate-500">{r.code ?? r.targetRef ?? r.label}</p></div> },
          { key:'status',label:'Statut',render:r => <BmStatusBadge value={r.status ?? (r.enabled === false ? 'INACTIVE' : r.relationType)}/> },
          { key:'details',label:'Détails',render:r => section === 'dependencies' ? `${r.dependencyType} → ${r.targetRef} ${r.targetVersionRange ?? ''}` : section === 'rules' ? `${r.effect} · ${r.targetId} · priorité ${r.priority}` : section === 'features' ? (r.capabilities ?? []).map(c => `${c.relationType}: ${c.capability.code}`).join(', ') : r.validationStatus ?? r.description ?? '—' },
          { key:'actions',label:'Actions',render:r => <div className="flex flex-wrap gap-2">{section === 'packs' ? <BmButton size="sm" variant="secondary" onClick={() => { context(r.id); navigate('/packs/versions?pack='+r.id+'&version='); }}>Ouvrir</BmButton> : section === 'versions' ? <BmButton size="sm" variant="secondary" onClick={() => { context(packId,r.id); navigate('/packs/modules?pack='+packId+'&version='+r.id); }}>Configurer</BmButton> : section === 'registry' ? <Link className="text-blue-700" to={'/runtime/context?pack='+r.code+'&packVersion='+r.versionNumber}>Ouvrir dans Runtime</Link> : section === 'capabilities' && allowed('pack.capability.update') ? <BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:section,row:r })}>Modifier</BmButton> : mutable && allowed('pack.update') ? <><BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:section,row:r })}>Modifier</BmButton><BmButton size="sm" variant="danger" disabled={busy} onClick={async () => { if (window.confirm('Archiver cet élément ?')) { try { await api.patch(root+`/resources/${section}/${r.id}`,{ rowVersion:r.rowVersion,archived:true }); refresh(); } catch(e) { setError(e.normalized?.message || 'Archivage refusé'); } } }}>Archiver</BmButton>{section === 'features' && <BmButton size="sm" variant="secondary" onClick={() => setEditor({ kind:'attach',row:r })}>Associer une capacité</BmButton>}</> : null}</div> },
        ]}/></>}
        {section === 'packs' && pack && allowed('pack.update') && <div className="flex gap-2"><BmButton variant="secondary" onClick={() => setEditor({ kind:'pack-duplicate' })}>Dupliquer la définition</BmButton><BmButton variant="secondary" onClick={() => setEditor({ kind:'pack-edit' })}>Modifier {pack.name}</BmButton><BmButton variant="danger" disabled={busy} onClick={() => { if (window.confirm(`${pack.archivedAt ? 'Restaurer' : 'Archiver'} ${pack.name} ?`)) action(`/packs/${packId}/${pack.archivedAt ? 'restore' : 'archive'}`); }}>{pack.archivedAt ? 'Restaurer' : 'Archiver'}</BmButton></div>}
        {section === 'versions' && version && allowed('pack.version.create') && <BmButton variant="secondary" onClick={() => setEditor({ kind:'clone' })}>Cloner la version {version.versionNumber}</BmButton>}
      </>}
      {['validation','publication'].includes(section) && (version ? <BmCard title={section === 'validation' ? 'Validation et manifest' : 'Publication de la version'}><div className="flex flex-wrap items-center gap-3 mb-4"><BmStatusBadge value={version.validationStatus}/><BmStatusBadge value={version.manifestStatus}/>{mutable && allowed('pack.version.validate') && <BmButton disabled={busy} onClick={() => action(`/versions/${versionId}/validate`)}>Valider</BmButton>}{mutable && version.validationStatus === 'VALID' && allowed('pack.version.generate.manifest') && <BmButton disabled={busy} variant="secondary" onClick={() => action(`/versions/${versionId}/manifest`)}>Générer le manifest</BmButton>}{version.status === 'READY' && version.manifestStatus === 'VALID' && allowed('pack.version.publish') && <BmButton disabled={busy} onClick={() => { if (window.confirm(`Publier ${pack.name} ${version.versionNumber} ? Cette version deviendra immuable.`)) action(`/versions/${versionId}/publish`); }}>Publier</BmButton>}{version.status === 'PUBLISHED' && <Link className="text-blue-700 font-semibold" to={'/runtime/context?pack='+pack.code+'&packVersion='+version.versionNumber}>Ouvrir dans Runtime →</Link>}</div><ValidationDetails versionId={versionId} revision={revision}/>{version.manifest ? <details className="mt-4"><summary className="cursor-pointer text-sm text-blue-700">Manifest · {version.manifest.contractVersion}</summary><p className="break-all text-xs py-3">{version.manifest.manifestHash}</p><pre className="max-h-96 overflow-auto rounded-lg bg-slate-50 p-4 text-xs">{JSON.stringify(version.manifest.content,null,2)}</pre></details> : <p className="text-sm text-slate-500">Aucun manifest généré. Une validation réussie est nécessaire.</p>}</BmCard> : <BmEmptyState title="Choisissez une version à valider"/>)}
    </>}
  </BmPage>;
}
function ValidationDetails({ versionId,revision }) {
  const [state,setState] = useState({ loading:true });
  useEffect(() => { let live = true; setState({ loading:true }); get(`/versions/${versionId}/validation`).then(data => { if (live) setState({ data }); }).catch(() => { if (live) setState({ error:true }); }); return () => { live = false; }; },[versionId,revision]);
  if (state.loading) return <BmLoading/>;
  if (state.error) return <BmErrorState message="Impossible de charger la validation."/>;
  if (!state.data) return <p className="text-sm text-slate-500">Aucune validation exécutée.</p>;
  return <div><p className="text-sm mb-3">Dernière validation : <BmStatusBadge value={state.data.status}/></p>{state.data.issues.length ? <ul className="space-y-2">{state.data.issues.map((i,n) => <li key={n} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><strong>{i.code}</strong> — {i.message}</li>)}</ul> : <p className="text-emerald-700 text-sm">Les contrôles exécutés ne signalent aucune erreur.</p>}</div>;
}
