import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { useTenant } from '../../contexts/TenantProvider.jsx';
import { ContextBar } from '../ContextBar.jsx';
import { PageHeader } from '../ui/PageHeader.jsx';
import { BMResourceEditor, BMTable, inputClass, buttonClass, bmError } from './BMResourceEditor.jsx';

const root = '/business-manager';
const common = [{key:'code',label:'Code technique',required:true},{key:'name',label:'Nom',required:true},{key:'description',label:'Description'}];
const columns = [{key:'name',label:'Nom'},{key:'code',label:'Code technique'},{key:'description',label:'Description'},{key:'status',label:'Statut'}];
const fieldTypes = 'TEXT LONG_TEXT INTEGER BIG_INTEGER DECIMAL CURRENCY PERCENTAGE BOOLEAN DATE DATETIME TIME EMAIL PHONE URL ENUM MULTI_ENUM UUID SEQUENCE FILE IMAGE JSON RELATION FORMULA'.split(' ');
const sections = [['data-model','Modèles de données'],['features','Fonctionnalités & Capabilities'],['navigation','Menus & Navigation'],['validation','Validation / Qualité']];
const get = path => api.get(root + path).then(r => r.data);

export default function BMWorkspaceRoute() {
  const { activeTenant } = useTenant();
  return <Workspace key={activeTenant?.id || 'none'} tenant={activeTenant} />;
}
function Workspace({tenant}) {
  const params = useParams(), location = useLocation(), navigate = useNavigate();
  const storageKey = `bm-context:${tenant?.id}`;
  const [saved, setSaved] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch { return {}; } });
  const applicationId = params.applicationId || saved.applicationId || '';
  const versionId = params.versionId || (applicationId === saved.applicationId ? saved.versionId : '') || '';
  const suffix = location.pathname.split('/').pop();
  const section = suffix === 'models' || !sections.some(([id]) => id === suffix) ? 'data-model' : suffix;
  const [applications,setApplications] = useState([]), [versions,setVersions] = useState([]);
  const [error,setError] = useState(''), [loading,setLoading] = useState(true), [revision,setRevision] = useState(0);
  useEffect(() => {
    let live = true; setLoading(true); setError(''); setApplications([]); setVersions([]);
    if (!tenant) { setLoading(false); return; }
    (async () => {
      const apps = await get('/applications');
      const vers = applicationId && apps.some(a => a.id === applicationId) ? await get(`/applications/${applicationId}/versions`) : [];
      if (live) { setApplications(apps); setVersions(vers); }
    })().catch(() => {if(live) setError(bmError);}).finally(() => {if(live) setLoading(false);});
    return () => {live = false;};
  }, [tenant?.id,applicationId,revision]);
  const application = applications.find(a => a.id === applicationId), version = versions.find(v => v.id === versionId);
  useEffect(() => { if(application && version) { sessionStorage.setItem(storageKey, JSON.stringify({applicationId,versionId})); setSaved(previous => previous.applicationId === applicationId && previous.versionId === versionId ? previous : {applicationId,versionId}); } }, [application,version,storageKey,applicationId,versionId]);
  const path = (a,v,s = section) => `${root}/applications/${a}/versions${v ? `/${v}/${s}` : ''}`;
  return <div className="p-6 space-y-5">
    <PageHeader title={sections.find(([id]) => id === section)?.[1]} subtitle="Définition de la version d’application sélectionnée" breadcrumb={[{label:'Business Manager',onClick:()=>navigate(root)},{label:'Applications',onClick:()=>navigate(`${root}/applications`)}]} />
    <ContextBar tenant={tenant?.name} application={application?.name} version={version?.version} status={version?.status} environment={version?.environment?.name} />
    <div className="flex flex-wrap gap-3"><Link className={buttonClass} to={`${root}/applications`}>Applications</Link><label>Application<select aria-label="Application" className={inputClass} value={application?.id || ''} onChange={e=>navigate(path(e.target.value,''))}><option value="">Sélectionner une application</option>{applications.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Version<select aria-label="Version" className={inputClass} value={version?.id || ''} onChange={e=>navigate(path(applicationId,e.target.value))}><option value="">Sélectionner une version</option>{versions.map(v=><option key={v.id} value={v.id}>{v.version} — {v.status}</option>)}</select></label></div>
    {loading ? <p role="status">Chargement…</p> : error ? <p role="alert">{error} <button className={buttonClass} onClick={()=>setRevision(r=>r+1)}>Réessayer</button></p> : !version ? <p>Sélectionnez une application et une version pour commencer.</p> : <>
      <nav className="flex flex-wrap gap-2 border-b pb-3">{sections.map(([id,label])=><Link key={id} aria-current={id === section ? 'page' : undefined} className={`${buttonClass} ${id===section ? 'bg-blue-100 text-blue-900' : ''}`} to={path(applicationId,versionId,id)}>{label}</Link>)}<Link className={buttonClass} to={`${root}/configuration?applicationId=${applicationId}&applicationVersionId=${versionId}`}>Configuration</Link></nav>
      <Domain key={`${versionId}:${section}`} versionId={versionId} section={section} />
    </>}
  </div>;
}

function Domain({versionId,section}) {
  const tabs = section === 'data-model' ? ['Vue d’ensemble','Entités','Champs','Relations','Contraintes'] : section === 'features' ? ['Features','Capabilities','Dépendances'] : section === 'navigation' ? ['Menus','Éléments','Routes'] : ['Rapports'];
  const [tab,setTab] = useState(tabs[0]), [rows,setRows] = useState([]), [relations,setRelations] = useState([]), [parent,setParent] = useState('');
  const [loading,setLoading] = useState(true), [error,setError] = useState(''), [editor,setEditor] = useState(null), [revision,setRevision] = useState(0), [busy,setBusy] = useState(false), [validationField,setValidationField] = useState(null);
  const base = section === 'data-model' ? `/data-model/${versionId}/schema` : section === 'features' ? `/features/${versionId}` : section === 'navigation' ? `/navigation/${versionId}/menus` : `/validation/${versionId}/reports`;
  useEffect(()=>{let live=true;setLoading(true);setError(''); Promise.all([get(base),section==='data-model'?get(`/data-model/${versionId}/relations`):Promise.resolve([])]).then(([data,rels])=>{if(live){setRows(data);setRelations(rels);}}).catch(()=>{if(live)setError(bmError);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[base,versionId,section,revision]);
  const selected = rows.find(r=>r.id===parent);
  const options = rows.map(r=>({value:r.id,label:r.name || r.code}));
  let data = rows, fields = common, createPath = '', updatePath, removePath, removeMethod = 'post', cols = columns;
  let needsParent = false;
  if(section==='data-model') {
    if(tab==='Champs') {
      needsParent=true; data=selected?.fields || []; createPath=`/data-model/entities/${parent}/fields`; updatePath=r=>`/data-model/fields/${r.id}`;removePath=updatePath;removeMethod='delete';
      fields=[common[0],{key:'label',label:'Libellé'},{key:'type',label:'Type',required:true,options:fieldTypes,default:'TEXT'},{key:'required',label:'Obligatoire',type:'checkbox'},{key:'defaultValue',label:'Valeur par défaut'},{key:'configuration',label:'Configuration (JSON)',type:'json'}];
      cols=[{key:'label',label:'Libellé'},columns[1],{key:'type',label:'Type'},{key:'required',label:'Obligatoire',render:r=>r.required?'Oui':'Non'}];
    } else if(tab==='Relations') {
      data=relations;createPath=`/data-model/${versionId}/relations`;fields=[common[0],{key:'sourceEntityId',label:'Entité source',required:true,options},{key:'targetEntityId',label:'Entité cible',required:true,options},{key:'deleteBehavior',label:'Comportement de suppression',options:['RESTRICT','CASCADE','SET_NULL'],default:'RESTRICT'}];cols=[columns[1],{key:'sourceEntityId',label:'Source',render:r=>rows.find(e=>e.id===r.sourceEntityId)?.name || 'Indisponible'},{key:'targetEntityId',label:'Cible',render:r=>rows.find(e=>e.id===r.targetEntityId)?.name || 'Indisponible'},{key:'deleteBehavior',label:'Suppression'}];
    } else if(tab==='Contraintes') {
      needsParent=true;data=selected?.constraints || [];createPath=`/data-model/entities/${parent}/constraints`;fields=[common[0],common[1],{key:'definition',label:'Définition (JSON)',type:'json'}];cols=columns.slice(0,2);
    } else {
      createPath=`/data-model/${versionId}/entities`;updatePath=r=>`/data-model/entities/${r.id}`;removePath=r=>`${updatePath(r)}/archive`;
      cols=[...columns,{key:'fields',label:'Champs',render:r=>r.fields.length},{key:'relations',label:'Relations',render:r=>relations.filter(rel=>rel.sourceEntityId===r.id || rel.targetEntityId===r.id).length}];
    }
  } else if(section==='features') {
    if(tab==='Capabilities') {
      needsParent=true;data=selected?.capabilities || [];createPath=`/features/feature/${parent}/capabilities`;fields=[...common,{key:'required',label:'Obligatoire',type:'checkbox'}];updatePath=r=>`/features/capabilities/${r.id}`;removePath=r=>`${updatePath(r)}/archive`;
    } else if(tab==='Dépendances') {
      data=rows.flatMap(f=>f.capabilities.flatMap(c=>(c.dependencies||[]).map(d=>({...d,name:c.name}))));cols=[columns[0],{key:'targetCapabilityCode',label:'Capability cible'},{key:'dependencyType',label:'Type'}];
    } else {createPath=`/features/${versionId}`;updatePath=r=>`/features/feature/${r.id}`;removePath=r=>`${updatePath(r)}/archive`;}
  } else if(section==='navigation') {
    if(tab==='Menus') {createPath=`/navigation/${versionId}/menus`;updatePath=r=>`/navigation/menus/${r.id}`;}
    else {
      needsParent=true;data=selected?.items||[];createPath=`/navigation/menus/${parent}/items`;updatePath=r=>`/navigation/items/${r.id}`;
      fields=[common[0],{key:'label',label:'Libellé'},{key:'itemType',label:'Type',options:['LINK','GROUP','SEPARATOR','EXTERNAL_LINK'],default:'LINK',required:true},{key:'routePath',label:'Route'},{key:'orderIndex',label:'Ordre',type:'number',default:0},{key:'visibility',label:'Visibilité',options:['VISIBLE','HIDDEN','DISABLED'],default:'VISIBLE'}];cols=[{key:'label',label:'Libellé'},columns[1],{key:'itemType',label:'Type'},{key:'routePath',label:'Route'},{key:'visibility',label:'Visibilité'}];
    }
  } else {cols=[{key:'completedAt',label:'Date',render:r=>r.completedAt?new Date(r.completedAt).toLocaleString():'En cours'},{key:'gateResult',label:'Résultat réel'},{key:'score',label:'Score'},{key:'issues',label:'Problèmes',render:r=>r.issues?.length ?? 0}];}
  async function mutate(action) {setBusy(true);setError('');try{await action();setRevision(r=>r+1);}catch{setError(bmError);}finally{setBusy(false);}}
  let editableFields = fields;
  if(editor?.id) editableFields=fields.filter(f=> !(f.key==='code' && section!=='navigation') && !(section==='navigation' && tab!=='Menus' && ['code','itemType'].includes(f.key)));
  return <section className="space-y-4">
    <nav aria-label="Onglets" className="flex flex-wrap gap-2">{tabs.map(t=><button key={t} className={`${buttonClass} ${t===tab?'bg-blue-100':''}`} aria-pressed={t===tab} onClick={()=>{setTab(t);setEditor(null);setValidationField(null);}}>{t}</button>)}</nav>
    {needsParent && <label>{section==='data-model'?'Entité':section==='features'?'Feature':'Menu'}<select aria-label={section==='data-model'?'Entité':section==='features'?'Feature':'Menu'} className={inputClass} value={parent} onChange={e=>{setParent(e.target.value);setEditor(null);setValidationField(null);}}><option value="">Sélectionner</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>}
    {error && <p role="alert" className="text-red-700">{error} <button className={buttonClass} onClick={()=>setRevision(r=>r+1)}>Réessayer</button></p>}
    {loading ? <p role="status">Chargement…</p> : !error && <>
      {createPath && <button className={buttonClass} disabled={busy || (needsParent && !selected)} onClick={()=>setEditor({})}>Créer {tab==='Vue d’ensemble'?'une entité':'un élément'}</button>}
      {section==='validation' && <button className={buttonClass} disabled={busy} onClick={()=>mutate(()=>api.post(`${root}/validation/${versionId}/run`,{}))}>Lancer la validation</button>}
      {editor && <BMResourceEditor key={`${tab}:${editor.id || 'new'}`} fields={editableFields} initial={editor} onCancel={()=>setEditor(null)} onSave={async body=>{await (editor.id ? api.patch(root+updatePath(editor),body) : api.post(root+createPath,body));setEditor(null);setRevision(r=>r+1);}} />}
      {validationField && <div className="rounded border p-4"><h3>Validation du champ : {validationField.label || validationField.code}</h3><BMResourceEditor fields={[{key:'validationType',label:'Validation',required:true,options:['REQUIRED','MIN','MAX','MIN_LENGTH','MAX_LENGTH','REGEX','EMAIL','URL','ALLOWED_VALUES','PRECISION','SCALE']},{key:'value',label:'Valeur'},{key:'message',label:'Message'}]} onCancel={()=>setValidationField(null)} onSave={async body=>{await api.post(root+'/data-model/field-validations',{...body,fieldId:validationField.id});setValidationField(null);setRevision(r=>r+1);}} /></div>}
      <BMTable rows={data} columns={cols} onView={section==='data-model' && ['Entités','Vue d’ensemble'].includes(tab) ? r=>{setParent(r.id);setTab('Champs');setEditor(null);} : section==='data-model' && tab==='Champs' ? r=>setValidationField(r) : undefined} onEdit={updatePath?r=>setEditor(r):undefined} onRemove={removePath?r=>mutate(()=>api[removeMethod](root+removePath(r))):undefined} removeLabel={removeMethod==='delete'?'Supprimer':'Archiver'} />
      {section==='validation' && rows.map(r=><div key={r.id}>{r.issues?.map(i=><p key={i.id} className="border-l-4 border-amber-400 pl-3 my-2">{i.severity} — {i.message || i.code}</p>)}</div>)}
    </>}
  </section>;
}
