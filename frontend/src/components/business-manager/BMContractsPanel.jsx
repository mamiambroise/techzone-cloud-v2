import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/apiClient.js';
import { BMResourceEditor } from './BMResourceEditor.jsx';
import { BmCard,BmButton,BmTable,BmStatusBadge,BmErrorState,BmLoading,BmEmptyState } from './bm/ui.jsx';
export default function BMContractsPanel({ versionId,applicationId }) {
  const [rows,setRows] = useState(null),[error,setError] = useState(''),[editor,setEditor] = useState(false),[busy,setBusy] = useState(false),[revision,setRevision] = useState(0);
  useEffect(() => { let live=true; setRows(null); api.get(`/business-manager/contracts/versions/${versionId}`).then(r => { if(live) setRows(r.data); }).catch(() => { if(live) setError('Impossible de charger les contrats.'); }); return () => { live=false; }; },[versionId,revision]);
  const refresh = () => setRevision(v => v+1);
  return <BmCard title="Contrats et passage vers Pack Manager" subtitle="Un contrat verrouillé et une validation récente sont requis par le Runtime.">
    {error && <BmErrorState message={error} onRetry={refresh}/>}
    <div className="mb-4 flex flex-wrap gap-3"><BmButton variant="secondary" onClick={() => setEditor(true)}>Créer un contrat</BmButton><Link className="py-2 text-sm font-semibold text-blue-700" to={`/packs?applicationId=${applicationId}&businessVersionId=${versionId}`}>Continuer dans Pack Manager →</Link></div>
    {editor && <BMResourceEditor fields={[{ key:'code',label:'Code du contrat',required:true },{ key:'name',label:'Nom du contrat',required:true },{ key:'manifest',label:'Contrat public (JSON)',type:'json',default:'{}' }]} onCancel={() => setEditor(false)} onSave={async body => { await api.post(`/business-manager/contracts/versions/${versionId}`,body);setEditor(false);refresh(); }}/>}
    {!rows ? !error && <BmLoading/> : <BmTable rows={rows} columns={[{ key:'name',label:'Contrat' },{ key:'version',label:'Version' },{ key:'status',label:'État',render:r => <BmStatusBadge value={r.status}/> },{ key:'action',label:'Action',render:r => r.status === 'DRAFT' && <BmButton size="sm" variant="secondary" disabled={busy} onClick={async () => { if(!window.confirm('Verrouiller ce contrat pour validation ?'))return;setBusy(true);try{await api.post(`/business-manager/contracts/contract/${r.id}/validate`,{});refresh();}catch{setError('Verrouillage refusé.');}finally{setBusy(false);}}}>Valider et verrouiller</BmButton> }]} emptyState={<BmEmptyState title="Aucun contrat"/>}/>}
  </BmCard>;
}
