import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { MODULES_BY_KEY, DEFAULT_ERP } from '../erp/modulesConfig';
import { productService } from '../services/api';
import { TableSkeleton } from '../components/Loaders';

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtNum(value, money) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  const out = n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return money ? `${out} €` : out;
}

function ErpModule() {
  const { moduleKey } = useParams();
  const mod = MODULES_BY_KEY[moduleKey];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!mod) return;
    setLoading(true);
    setError(null);
    mod.service
      .getAll(DEFAULT_ERP)
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [mod]);

  const Icon = mod?.icon;

  if (!mod) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-red-600 font-medium">Module inconnu : {moduleKey}</p>
            <Link to="/erps" className="text-blue-600 text-sm hover:underline">Retour aux ERP</Link>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = !!mod.service?.update;
  const canDelete = !!mod.service?.delete;

  const handleEdit = (row) => {
    setEditingRow(row);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer cet element (${row.id}) ?`)) return;
    setDeleteError(null);
    try {
      await mod.service.delete(row.id, DEFAULT_ERP);
      setRows((r) => r.filter((x) => x.id !== row.id));
      setSuccess('Element supprime');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Suppression impossible');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* En-tete */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-[#5469D4]">
            <ArrowLeftIcon className="w-4 h-4" /> Tableau de bord
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white shadow-lg`}>
              {Icon && <Icon className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{mod.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{mod.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${mod.gradient}`} />
            {rows.length} elements reels
          </span>
          {mod.create && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-4 py-2 text-sm font-medium shadow"
            >
              <PlusIcon className="w-4 h-4" /> Creer
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-lg px-4 py-2 text-sm">
          <CheckCircleIcon className="w-4 h-4" /> {success}
        </div>
      )}
      {deleteError && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" /> {error}
            </div>
      )}
      {mod.notice && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 text-amber-700 dark:text-amber-300 rounded-lg px-4 py-3 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 mt-0.5" /> {mod.notice}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-700/40">
                <tr>
                  {mod.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {c.label}
                    </th>
                  ))}
                    {canEdit || canDelete ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={mod.columns.length + (canEdit || canDelete ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      Aucune donnee dans Dolibarr pour ce module.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    {mod.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">
                        {c.money ? fmtNum(row[c.key], true) : c.date ? fmtDate(row[c.key]) : fmtNum(row[c.key])}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(row)}
                              className="inline-flex items-center gap-1 text-[#5469D4] hover:text-[#3B4BA8] text-sm"
                              title="Modifier"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(row)}
                              className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && mod.create && (
        <CreateModal mod={mod} onClose={() => setShowModal(false)} onCreated={(item) => {
          setRows((r) => [item, ...r]);
          setShowModal(false);
        }} />
      )}
      {editingRow && mod.service?.update && (
        <CreateModal
          mod={mod}
          editing={editingRow}
          onClose={() => setEditingRow(null)}
          onCreated={(item) => {
            setRows((r) => r.map((x) => (x.id === item.id ? item : x)));
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}

function CreateModal({ mod, onClose, onCreated, editing = null }) {
  const [form, setForm] = useState(editing ? Object.fromEntries(mod.fields.map((f) => [f.name, editing[f.name] ?? ''])) : {});
  const [lineItems, setLineItems] = useState(editing?.lines?.length ? editing.lines.map((l) => ({ productId: String(l.productId), quantity: l.quantity, price: l.price })) : [{ productId: '', quantity: 1, price: 0 }]);
  const [optionsCache, setOptionsCache] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEditing = !!editing;

  function toLocalInput(v) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  useEffect(() => {
    const loads = {};
    mod.fields
      .filter((f) => f.source)
      .forEach((f) => {
        loads[f.name] = f.source
          .getAll(DEFAULT_ERP)
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : [];
            setOptionsCache((prev) => ({ ...prev, [f.name]: list }));
          })
          .catch(() => {});
      });
    if (mod.lines) {
      loads._products = productService
        .getAll(DEFAULT_ERP)
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          setOptionsCache((prev) => ({ ...prev, _products: list }));
        })
        .catch(() => {});
    }
    Promise.all(Object.values(loads)).finally(() => setSaving(false));
  }, [mod]);

  const buildPayload = () => {
    const payload = {};
    for (const f of mod.fields) {
      const val = form[f.name];
      if (f.type === 'number') {
        payload[f.name] = val === undefined || val === '' ? undefined : Number(val);
      } else if (f.type === 'datetime-local' && val) {
        const d = new Date(val);
        payload[f.name] = Number.isNaN(d.getTime()) ? val : d.toISOString();
      } else if (val !== undefined && val !== '') {
        payload[f.name] = val;
      }
    }
    if (mod.lines) {
      payload.lines = lineItems
        .filter((l) => l.productId)
        .map((l) => ({ productId: String(l.productId), quantity: Number(l.quantity) || 0, price: Number(l.price) || 0 }));
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = isEditing
        ? await mod.service.update(editing.id, payload, DEFAULT_ERP)
        : await mod.service.create(payload, DEFAULT_ERP);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || (isEditing ? 'Modification impossible' : 'Creation impossible'));
    } finally {
      setSaving(false);
    }
  };

  const input = (f) => {
    const base =
      'w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/40 focus:border-[#5469D4]';
    if (f.type === 'select') {
      const opts = f.options || (optionsCache[f.name] || []);
      return (
        <select className={base} value={form[f.name] || ''} onChange={(ev) => setForm({ ...form, [f.name]: ev.target.value })}>
          <option value="">-- selectionner --</option>
          {opts.map((o) => {
            if (f.options) {
              return (
                <option key={o.value} value={o.value}>{o.label}</option>
              );
            }
            return (
              <option key={o[f.valueKey]} value={o[f.valueKey]}>{o[f.labelKey]}</option>
            );
          })}
        </select>
      );
    }
    return (
      <input
        type={f.type || 'text'}
        step={f.step}
        className={base}
        value={(f.type === 'datetime-local' || f.type === 'date') ? toLocalInput(form[f.name]) : (form[f.name] || '')}
        onChange={(ev) => setForm({ ...form, [f.name]: ev.target.value })}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Modifier' : 'Creer'} - {mod.title}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" /> {error}
            </div>
          )}
          {mod.fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {input(f)}
            </div>
          ))}

          {mod.lines && (
            <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lignes</p>
              </div>
              {lineItems.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/40"
                      value={line.productId || ''}
                      onChange={(ev) => {
                        const next = [...lineItems];
                        next[idx] = { ...next[idx], productId: ev.target.value };
                        setLineItems(next);
                      }}
                    >
                      <option value="">-- produit --</option>
                      {(optionsCache._products || []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.ref} - {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
                      value={line.quantity}
                      onChange={(ev) => {
                        const next = [...lineItems];
                        next[idx] = { ...next[idx], quantity: ev.target.value };
                        setLineItems(next);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Prix HT"
                      value={line.price}
                      onChange={(ev) => {
                        const next = [...lineItems];
                        next[idx] = { ...next[idx], price: ev.target.value };
                        setLineItems(next);
                      }}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLineItems([...lineItems, { productId: '', quantity: 1, price: 0 }])}
                className="inline-flex items-center gap-1 text-sm text-[#5469D4] hover:text-[#3B4BA8]"
              >
                <PlusIcon className="w-4 h-4" /> Ajouter une ligne
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              Enregistrer dans Dolibarr
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ErpModule;