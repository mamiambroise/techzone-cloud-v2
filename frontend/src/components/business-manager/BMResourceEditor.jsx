import { Inbox } from 'lucide-react';
import BMStatusBadge from './BMStatusBadge.jsx';
import { useState } from 'react';

export const inputClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm w-full outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-colors duration-150 ease-out motion-reduce:transition-none';
export const buttonClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-200 transition-colors duration-150 ease-out motion-reduce:transition-none disabled:opacity-50';
export const bmError = 'Opération impossible. Vérifiez les valeurs, vos droits et la disponibilité du service, puis réessayez.';

// Only declared DTO properties are submitted; server records never become request bodies.
export function BMResourceEditor({ fields, initial = {}, onSave, onCancel }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(f => [f.key, initial[f.key] ?? f.default ?? (f.type === 'checkbox' ? false : '')])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const body = {};
      for (const f of fields) {
        const value = values[f.key];
        if (f.type === 'json') { if (value !== '') body[f.key] = typeof value === 'string' ? JSON.parse(value) : value; }
        else if (f.type === 'number') { if (value !== '') body[f.key] = Number(value); }
        else body[f.key] = value;
      }
      await onSave(body);
    } catch { setError(bmError); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="my-4 rounded-lg border bg-slate-50 p-4 space-y-4">
    <div className="grid gap-4 md:grid-cols-2">{fields.map(f => <label key={f.key} className="text-sm space-y-1"><span>{f.label}</span>
      {f.options ? <select aria-label={f.label} className={inputClass} required={f.required} value={values[f.key]} onChange={e => setValues({...values, [f.key]: e.target.value})}><option value="">Sélectionner</option>{f.options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
        : f.type === 'json' ? <textarea aria-label={f.label} className={inputClass} value={typeof values[f.key] === 'object' ? JSON.stringify(values[f.key], null, 2) : values[f.key]} onChange={e => setValues({...values, [f.key]: e.target.value})} />
          : <input aria-label={f.label} className={f.type === 'checkbox' ? 'ml-2' : inputClass} type={f.type || 'text'} required={f.required} maxLength={f.key === 'code' ? 100 : undefined} checked={f.type === 'checkbox' ? values[f.key] : undefined} value={f.type === 'checkbox' ? undefined : values[f.key]} onChange={e => setValues({...values, [f.key]: f.type === 'checkbox' ? e.target.checked : e.target.value})} />}
    </label>)}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={busy} className={buttonClass}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>{' '}<button type="button" disabled={busy} onClick={onCancel} className={buttonClass}>Annuler</button>
  </form>;
}

export function BMTable({ rows, columns, onView, onEdit, onRemove, removeLabel = 'Archiver' }) {
  const [search, setSearch] = useState('');
  const filtered = rows.filter(r => columns.some(c => String(c.render ? c.render(r) : r[c.key] ?? '').toLowerCase().includes(search.toLowerCase())));
  return <div className="space-y-3"><input aria-label="Rechercher" placeholder="Rechercher…" className={inputClass} value={search} onChange={e => setSearch(e.target.value)} />
    {!filtered.length ? <div className="rounded-xl border border-slate-100 bg-slate-50/30 px-5 py-7 text-center"><Inbox aria-hidden="true" className="mx-auto mb-2 h-6 w-6 text-slate-300"/><p className="text-sm font-semibold text-slate-600">Aucun élément</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">Utilisez l’action de création pour commencer, ou ajustez la recherche.</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50/80 text-[11px] font-medium text-slate-500"><tr>{columns.map(c => <th key={c.key} className="p-3">{c.label}</th>)}<th className="p-3">Actions</th></tr></thead><tbody>{filtered.map((row, i) => <tr key={row.id || i} className="group border-t border-slate-100 bg-white hover:bg-slate-50/50 transition-colors duration-150 ease-out motion-reduce:transition-none">{columns.map(c => <td key={c.key} className="p-3">{['status','gateResult'].includes(c.key) ? <BMStatusBadge status={row[c.key]}/> : c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>)}<td className="p-3 space-x-2 whitespace-nowrap align-middle">{onView && <button className={buttonClass} onClick={() => onView(row)}>Voir</button>}{onEdit && <button disabled={row.status === 'ARCHIVED'} className={buttonClass} onClick={() => onEdit(row)}>Modifier</button>}{onRemove && <button disabled={row.status === 'ARCHIVED'} className={buttonClass} onClick={() => { if (window.confirm(`${removeLabel} « ${row.name || row.label || row.code} » ?`)) onRemove(row); }}>{removeLabel}</button>}</td></tr>)}</tbody></table></div>}
  </div>;
}
