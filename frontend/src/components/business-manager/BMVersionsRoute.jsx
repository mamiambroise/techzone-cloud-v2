import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader.jsx';
import { api } from '../../services/apiClient.js';
import { BMResourceEditor, BMTable, buttonClass, bmError } from './BMResourceEditor.jsx';
export function BMVersionsRoute() {
 const {applicationId} = useParams(), navigate = useNavigate();
 const [versions,setVersions] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState(''), [editor,setEditor] = useState(null), [revision,setRevision] = useState(0);
 const path = applicationId ? '/business-manager/applications/'+applicationId+'/versions' : '/business-manager/versions';
 useEffect(()=>{let live=true;setLoading(true);setError('');api.get(path).then(r=>{if(live)setVersions(r.data);}).catch(()=>{if(live)setError(bmError);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[path,revision]);
 return <div className="p-6 space-y-4"><PageHeader title="Versions" subtitle="Versions réelles de vos applications" /><Link to="/business-manager/applications">Applications</Link>{' '}{applicationId && <button className={buttonClass} onClick={()=>setEditor({})}>Nouvelle version</button>}
 {editor && <BMResourceEditor fields={[...(!editor.id?[{key:'version',label:'Version',required:true}]:[]),{key:'releaseNotes',label:'Notes de version'}]} initial={editor} onCancel={()=>setEditor(null)} onSave={async body=>{await (editor.id?api.patch('/business-manager/versions/'+editor.id,body):api.post(path,body));setEditor(null);setRevision(r=>r+1);}} />}
 {loading?<p>Chargement…</p>:error?<p role="alert">{error} <button onClick={()=>setRevision(r=>r+1)}>Réessayer</button></p>:<BMTable rows={versions} columns={[{key:'version',label:'Version'},{key:'status',label:'Statut'},{key:'releaseNotes',label:'Notes'}]} onView={v=>navigate('/business-manager/applications/'+(v.applicationId || applicationId)+'/versions/'+v.id+'/data-model')} onEdit={setEditor} />}
 </div>;
}
