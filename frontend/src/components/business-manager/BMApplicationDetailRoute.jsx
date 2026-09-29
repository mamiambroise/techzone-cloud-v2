import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { PageHeader } from '../ui/PageHeader.jsx';
import { BMResourceEditor, buttonClass, bmError } from './BMResourceEditor.jsx';
export function BMApplicationDetailRoute() {
 const {applicationId} = useParams();
 const [app,setApp] = useState(null), [error,setError] = useState(''), [edit,setEdit] = useState(false), [revision,setRevision] = useState(0);
 const path = '/business-manager/applications/'+applicationId;
 useEffect(()=>{let live=true;setApp(null);setError('');api.get(path).then(r=>{if(live)setApp(r.data);}).catch(()=>{if(live)setError(bmError);});return()=>{live=false;};},[path,revision]);
 return <div className="p-6 space-y-4"><PageHeader title={app?.name || 'Application'} subtitle={app?.description} />
 {error ? <p role="alert">{error} <button onClick={()=>setRevision(r=>r+1)}>Réessayer</button></p> : !app ? <p>Chargement…</p> : <>
 <p>{app.code} ? {app.status}</p><Link className={buttonClass} to={path+'/versions'}>Versions</Link>{' '}<button className={buttonClass} disabled={app.status==='ARCHIVED'} onClick={()=>setEdit(true)}>Modifier</button>
 {edit && <BMResourceEditor fields={[{key:'name',label:'Nom',required:true},{key:'description',label:'Description'}]} initial={app} onCancel={()=>setEdit(false)} onSave={async body=>{const r=await api.patch(path,body);setApp(r.data);setEdit(false);}} />}
 </>}
 </div>;
}
