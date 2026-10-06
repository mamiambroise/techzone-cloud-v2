import React, { useEffect, useState } from 'react';
import { queryRuntime } from '../services/uiBuilderService.js';
import { fieldSchema, recordRows, runtimeResource } from './runtimeBinding.js';

/** Metadata-only input; relation choices are always read from Data Runtime. */
export default function RuntimeField({ node, ctx }) {
  const schema = fieldSchema(node, ctx.businessContext);
  const props = node.props || {};
  const resource = runtimeResource(schema?.relationTarget, ctx.businessContext);
  const [choices, setChoices] = useState({ resource: null, rows: [], loading: false, error: null });
  useEffect(() => {
    let active = true;
    if (!resource) return undefined;
    setChoices({ resource, rows: [], loading: true, error: null });
    async function read() {
      const rows = [];
      for (let page = 1; ; page++) {
        const result = await queryRuntime(resource, { page, pageSize: 100 });
        if (!active) return;
        const batch = recordRows(result);
        rows.push(...batch);
        if (!batch.length || rows.length >= result.total || batch.length < 100) break;
        if (page >= 100) throw new Error('Relation too large');
      }
      if (active) setChoices({ resource, rows, loading: false, error: null });
    }
    read().catch(() => active && setChoices({ resource, rows: [], loading: false, error: 'Options indisponibles. Rechargez la page.' }));
    return () => { active = false; };
  }, [resource, ctx.dataRevision]);
  const type = schema?.type;
  const value = ctx.record?.[node.bindings?.value?.field] ?? schema?.defaultValue ?? '';
  const [selected, setSelected] = useState(String(value));
  useEffect(() => { setSelected(String(value)); }, [value]);
  const common = {
    name: node.id, required: Boolean(props.required ?? schema?.required),
    disabled: Boolean(ctx.readonly || props.readonly || schema?.readonly),
    defaultValue: typeof value === 'string' || typeof value === 'number' ? String(value) : '',
    className: 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400',
  };
  let input;
  if (type === 'ENUM' || type === 'RELATION') {
    const ready = choices.resource === resource;
    const options = type === 'ENUM' ? (schema.options || []).map(value => ({ value, label: value }))
      : (ready ? choices.rows : []).map(row => ({ value: row.id, label: String(row.name || row.code || row.reference || row.number || row.id) }));
    const unavailable = type === 'RELATION' && (!ready || choices.loading || Boolean(choices.error));
    input = <><select {...common} data-runtime-blocked={!common.disabled && unavailable ? 'true' : undefined} defaultValue={undefined} value={selected} onChange={event => setSelected(event.target.value)} disabled={common.disabled || unavailable}>
      <option value="">{type === 'RELATION' && (!ready || choices.loading) ? 'Chargement…' : 'Sélectionner'}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>{type === 'RELATION' && ready && choices.error && <span role="alert">{choices.error}</span>}</>;
  } else if (type === 'LONG_TEXT') input = <textarea {...common} rows={3} />;
  else {
    const inputType = type === 'BOOLEAN' ? 'checkbox' : ['INTEGER','DECIMAL'].includes(type) ? 'number' : type === 'EMAIL' ? 'email' : type === 'DATE' ? 'date' : type === 'DATETIME' ? 'datetime-local' : 'text';
    input = <input {...common} type={inputType} step={type === 'DECIMAL' ? 'any' : undefined} defaultChecked={type === 'BOOLEAN' ? value === true || value === 'true' : undefined} placeholder={props.placeholder || ''} />;
  }
  return <label className="flex min-w-0 flex-col gap-1"><span className="text-xs font-medium text-slate-600">{props.label || schema?.label || 'Champ métier'}</span>{input}</label>;
}
