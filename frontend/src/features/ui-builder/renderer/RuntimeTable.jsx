import React, { useEffect, useState } from 'react';
import { executeRuntime, queryRuntime } from '../services/uiBuilderService.js';
import { runtimeResource, recordRows } from './runtimeBinding.js';

export default function RuntimeTable({ node, props, ctx }) {
  const entity = node.bindings?.rows?.entity;
  const resource = runtimeResource(entity, ctx.businessContext);
  const fields = ctx.businessContext?.entities?.find(e => e.code === entity)?.fields || [];
  const [page, setPage] = useState(1), [filter, setFilter] = useState(''), [field, setField] = useState(fields.find(f => f.type === 'TEXT')?.code || ''), [sort, setSort] = useState(fields[0] ? { field: fields[0].code, direction: 'ASC' } : null);
  const [state, setState] = useState({ rows: [], total: 0, loading: true, error: null });
  const pageSize = Math.min(Number(props.pageSize) || 20, 100);
  useEffect(() => {
    let active = true;
    setState({ rows: [], total: 0, loading: true, error: null });
    if (!resource) { setState({ rows: [], total: 0, loading: false, error: 'Ressource non définie.' }); return undefined; }
    queryRuntime(resource, { page, pageSize, ...(sort ? { sort: [sort] } : {}), ...(filter && field ? { filter: { logic: 'AND', conditions: [{ field, operator: 'CONTAINS', value: filter }] } } : {}) })
      .then(result => active && setState({ rows: recordRows(result), total: result.total, loading: false, error: null }))
      .catch(() => active && setState({ rows: [], total: 0, loading: false, error: 'Lecture Data Runtime impossible.' }));
    return () => { active = false; };
  }, [resource, page, pageSize, filter, field, sort, ctx.dataRevision]);
  async function archive(id) {
    if (ctx.mode === 'preview' || !window.confirm('Archiver cet enregistrement ?')) return;
    try {
      const result = await executeRuntime({ resource, operation: 'DELETE', targetId: id });
      if (!result.success) throw new Error();
      ctx.refreshData();
    } catch { setState(current => ({ ...current, error: 'Archivage refusé.' })); }
  }
  const columns = fields.length ? fields.map(f => f.code) : Object.keys(state.rows[0] || {}).filter(c => c !== 'id');
  return <section className="w-full min-w-0 rounded-lg border border-slate-200 bg-white" aria-label={props.title || entity}>
    <h2 className="px-4 py-3 text-sm font-semibold">{props.title || entity}</h2>
    <div className="flex flex-wrap items-end gap-3 px-4 pb-3">
      <label className="text-xs">Champ<select aria-label="Champ de recherche" value={field} onChange={e => { setField(e.target.value); setPage(1); }} className="block rounded border p-2">{fields.filter(f => ['TEXT','EMAIL','LONG_TEXT'].includes(f.type)).map(f => <option key={f.code} value={f.code}>{f.label}</option>)}</select></label>
      <label className="text-xs">Rechercher<input type="search" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="block rounded border p-2" /></label>
      {ctx.onNavigate && <button className="rounded border px-3 py-2 text-sm" onClick={() => ctx.onNavigate(entity + '-create')}>Créer</button>}
      <button className="rounded border px-3 py-2 text-sm" onClick={ctx.refreshData}>Actualiser</button>
    </div>
    {state.error && <p role="alert" className="px-4 py-2">{state.error}</p>}
    <div className="overflow-x-auto" tabIndex={0} aria-label="Tableau défilant"><table className="w-full text-left text-sm"><thead><tr>{columns.map(column => <th key={column} className="px-4 py-2" aria-sort={sort?.field === column ? sort.direction === 'ASC' ? 'ascending' : 'descending' : 'none'}><button onClick={() => { setSort({ field: column, direction: sort?.field === column && sort.direction === 'ASC' ? 'DESC' : 'ASC' }); setPage(1); }}>{column}</button></th>)}{ctx.onNavigate && <th>Actions</th>}</tr></thead>
      <tbody>{state.rows.map(row => <tr key={row.id} className="border-t border-slate-100">{columns.map(column => <td key={column} className="px-4 py-2">{String(row[column] ?? '')}</td>)}{ctx.onNavigate && <td className="whitespace-nowrap px-4 py-2"><button onClick={() => ctx.onNavigate(entity + '-detail', row.id)}>Détail</button> · <button onClick={() => ctx.onNavigate(entity + '-edit', row.id)}>Modifier</button> · <button disabled={ctx.mode === 'preview'} onClick={() => archive(row.id)}>Archiver</button></td>}</tr>)}</tbody></table></div>
    <div role="status" className="px-4 py-2 text-sm">{state.loading ? 'Chargement…' : `${state.total} enregistrement(s)`}{!state.loading && !state.rows.length && ' — Aucun enregistrement'}</div>
    <nav aria-label="Pagination" className="flex items-center gap-3 px-4 pb-3 text-sm"><button disabled={page <= 1 || state.loading} onClick={() => setPage(p => p-1)}>Précédent</button><span>Page {page}</span><button disabled={page * pageSize >= state.total || state.loading} onClick={() => setPage(p => p+1)}>Suivant</button></nav>
  </section>;
}
