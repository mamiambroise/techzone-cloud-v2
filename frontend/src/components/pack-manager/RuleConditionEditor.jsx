import { useId, useState } from 'react';

const input = 'w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800 focus:border-blue-400 bm-focus';
const textAction = 'rounded-md px-1 py-0.5 text-xs font-medium bm-focus';
export default function RuleConditionEditor({ value,onChange }) {
  const [advanced,setAdvanced] = useState(false);
  const editorId = useId();
  let parsed; try { parsed = typeof value === 'string' ? JSON.parse(value) : value; } catch { parsed = null; }
  const group = parsed?.any ? 'any' : 'all';
  const rows = parsed?.all ?? parsed?.any ?? (parsed?.field ? [parsed] : []);
  const update = (index,patch) => onChange({ [group]:rows.map((r,i) => i === index ? { ...r,...patch } : r) });
  return <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
    <select aria-label="Combinaison des conditions" className={input} value={group} onChange={e => onChange({ [e.target.value]:rows })}><option value="all">Toutes les conditions (ET)</option><option value="any">Au moins une condition (OU)</option></select>
    <button type="button" className={`${textAction} text-blue-700 hover:bg-blue-50 hover:text-blue-800`} aria-expanded={advanced} aria-controls={editorId} onClick={() => setAdvanced(v => !v)}>{advanced ? 'Éditeur visuel' : 'Conditions imbriquées / JSON'}</button>
    <div id={editorId}>{advanced ? <textarea aria-label="Expression de règle JSON" rows={6} className={`${input} font-mono`} value={typeof value === 'string' ? value : JSON.stringify(value,null,2)} onChange={e => onChange(e.target.value)}/> : <>
      {rows.length === 0 && <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">Aucune condition. Ajoutez-en une pour limiter l’application de cette règle.</p>}
      {rows.map((r,i) => <div key={i} className="grid gap-2"><select aria-label={`Champ condition ${i+1}`} className={input} value={r.field} onChange={e => update(i,{ field:e.target.value })}>{['tenant.id','application.id','application.version','environment.code','permissions','capabilities','locale','timezone'].map(f => <option key={f}>{f}</option>)}</select><select aria-label={`Opérateur condition ${i+1}`} className={input} value={r.operator} onChange={e => update(i,{ operator:e.target.value })}>{[['EQ','Est égal à'],['NEQ','Est différent de'],['CONTAINS','Contient'],['EXISTS','Est renseigné']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>{r.operator !== 'EXISTS' && <input aria-label={`Valeur condition ${i+1}`} className={input} value={r.value ?? ''} onChange={e => update(i,{ value:e.target.value })}/>}<button type="button" className="text-left text-xs text-rose-700" onClick={() => onChange({ [group]:rows.filter((_,n) => n !== i) })}>Retirer la condition</button></div>)}
      <button type="button" className={`${textAction} text-blue-700 hover:bg-blue-50 hover:text-blue-800`} onClick={() => onChange({ [group]:[...rows,{ field:'environment.code',operator:'EQ',value:'' }] })}>Ajouter une condition</button>
    </>}</div>
  </div>;
}
