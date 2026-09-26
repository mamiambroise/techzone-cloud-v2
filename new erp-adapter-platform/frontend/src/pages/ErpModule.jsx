import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  InboxIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import { MODULES_BY_KEY } from '../erp/modulesConfig';
import { productService } from '../services/api';
import { TableSkeleton } from '../components/Loaders';

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtNum(value, money) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  const out = n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return money ? `${out} €` : out;
}

const STATUS_STYLES = {
  DRAFT: ['bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'],
  BROUILLON: ['bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'],
  EN_ATTENTE: ['bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700'],
  EN_COURS: ['bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700'],
  PROCESSING: ['bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700'],
  CONFIRMEE: ['bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700'],
  VALIDE: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  VALIDATED: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  LIVREE: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  PAYEE: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  SHIPPED: ['bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700'],
  TERMINE: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  ACTIVE: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  ANNULEE: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700'],
  ABANDONNEE: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700'],
  LOW: ['bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700'],
  OUT: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700'],
  CRITICAL: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700'],
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  BROUILLON: 'Brouillon',
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  PROCESSING: 'En cours',
  CONFIRMEE: 'Confirmee',
  VALIDE: 'Valide',
  VALIDATED: 'Validee',
  LIVREE: 'Livree',
  PAYEE: 'Payee',
  SHIPPED: 'Expediee',
  TERMINE: 'Termine',
  ACTIVE: 'Actif',
  ANNULEE: 'Anulee',
  ABANDONNEE: 'Abandonnee',
  INACTIF: 'Inactif',
  CLOUD: 'En pause',
  SUSPENDU: 'Suspendu',
};

const isStatus = (v) => {
  if (v === null || v === undefined || v === '') return false;
  const keys = Object.keys(STATUS_STYLES);
  return keys.some((k) => String(v).toUpperCase() === k);
};

function StatusBadge({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  const upper = String(value).toUpperCase();
  if (isStatus(value)) {
    const styles = STATUS_STYLES[upper] || STATUS_STYLES.ACTIVE;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[0]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {STATUS_LABELS[upper] || value}
      </span>
    );
  }
  return <span className="text-slate-700 dark:text-slate-200">{value}</span>;
}

function ErpModule() {
  const { moduleKey } = useParams();
  const mod = MODULES_BY_KEY[moduleKey];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    setEmpty(false);
    mod.service
      .getAll()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setRows(data);
        setEmpty(data.length === 0);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Erreur de chargement');
        setEmpty(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!mod) return;
    load();
  }, [mod]);

  const Icon = mod?.icon;

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    const keys = mod.columns.map((c) => c.key);
    return rows.filter((r) =>
      keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q))
    );
  }, [rows, query, mod]);

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
  const hasActions = canEdit || canDelete;

  const handleEdit = (row) => setEditingRow(row);

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer cet element (${row.id}) ?`)) return;
    setDeleteError(null);
    try {
       await mod.service.delete(row.id);
      setRows((r) => r.filter((x) => x.id !== row.id));
      setSuccess('Element supprime');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Suppression impossible');
    }
  };

  // Ref en premiere colonne = identite
  const identityKey = mod.columns.find((c) => /ref|nom|label|libelle/i.test(c.key))?.key;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Fil d'ariane */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
        <Link to="/" className="hover:text-[#5469D4] flex items-center gap-1">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Tableau de bord
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-500 dark:text-slate-400">{mod.title}</span>
      </nav>

      {/* Hero carte */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${mod.gradient} opacity-[0.08] blur-2xl`} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white shadow-lg shadow-slate-900/10`}>
              {Icon && <Icon className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{mod.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{mod.subtitle}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-red-500' : empty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  {error ? 'Erreur de connexion' : empty ? 'Module vide' : 'Dolibarr · donnees reelles'} · {error ? '—' : `${filtered.length} sur ${rows.length}`} affiche(s)
                </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {mod.create && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-[#5469D4]/25 transition-all active:scale-95"
              >
                <PlusIcon className="w-5 h-5" /> Nouveau
              </button>
            )}
          </div>
        </div>

        {/* Stats rapides */}
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{error ? '—' : rows.length}</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 hidden sm:block">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Cree recemment</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">-</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">En base</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{error ? '—' : rows.length}</p>
            </div>
          </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-2.5 text-sm">
          <CheckCircleIcon className="w-4 h-4" /> {success}
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4" /> {deleteError}
        </div>
      )}
      {mod.notice && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-3 text-sm">
          <ExclamationTriangleIcon className="w-4 h-4 mt-0.5" /> {mod.notice}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : empty ? (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-2xl p-8 flex flex-col items-center gap-3">
          <InboxIcon className="w-12 h-12 text-amber-400" />
          <p className="text-amber-700 dark:text-amber-300 font-medium text-lg">Aucune donnee pour ce module</p>
          <p className="text-sm text-amber-600 dark:text-amber-400">La liste est vide dans le systeme ERP.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Barre d'outils */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Rechercher dans ${mod.title.toLowerCase()}...`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 pl-9 pr-3 py-2 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4]"
              />
            </div>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#5469D4] transition-colors">
              <ArrowPathRoundedSquareIcon className="w-4 h-4" /> Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-100 dark:divide-slate-700/60">
              <thead className="bg-slate-50 dark:bg-slate-700/40">
                <tr>
                  {mod.columns.map((c) => (
                    <th key={c.key} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {c.label}
                    </th>
                  ))}
                  {hasActions ? <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={mod.columns.length + (hasActions ? 1 : 0)} className="px-5 py-14">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-3">
                          <InboxIcon className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          {query ? 'Aucun resultat pour cette recherche' : 'Aucune donnee pour ce module'}
                        </p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                          {query ? 'Essayez un autre terme de recherche.' : 'Creez un element via le bouton "Nouveau".'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      {mod.columns.map((c) => (
                        <td key={c.key} className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200">
                          {c.key === identityKey ? (
                            <span className="font-mono text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                              {fmtNum(row[c.key])}
                            </span>
                          ) : isStatus(row[c.key]) ? (
                            <StatusBadge value={row[c.key]} />
                          ) : c.money ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{fmtNum(row[c.key], true)}</span>
                          ) : c.date ? (
                            <span className="text-slate-500 dark:text-slate-400">{fmtDate(row[c.key])}</span>
                          ) : (
                            fmtNum(row[c.key])
                          )}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(row)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#5469D4] hover:bg-[#5469D4]/10 transition-colors"
                                title="Modifier"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(row)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title="Supprimer"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pied de table */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{filtered.length} element(s)</span>
            <span className="inline-flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${mod.gradient}`} />
              Module {mod.title}
            </span>
          </div>
        </div>
      )}

      {showModal && mod.create && (
        <CreateModal mod={mod} onClose={() => setShowModal(false)} onCreated={(item) => {
          setRows((r) => [item, ...r]);
          setShowModal(false);
          setSuccess('Element cree');
          setTimeout(() => setSuccess(null), 3000);
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
            setSuccess('Element mis a jour');
            setTimeout(() => setSuccess(null), 3000);
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
          .getAll()
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : [];
            setOptionsCache((prev) => ({ ...prev, [f.name]: list }));
          })
          .catch(() => {});
      });
    if (mod.lines) {
      loads._products = productService
        .getAll()
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
        ? await mod.service.update(editing.id, payload)
        : await mod.service.create(payload);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || (isEditing ? 'Modification impossible' : 'Creation impossible'));
    } finally {
      setSaving(false);
    }
  };

  const input = (f) => {
    const base =
      'w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/40 focus:border-[#5469D4] transition-shadow';
    if (f.type === 'select') {
      const opts = f.options || (optionsCache[f.name] || []);
      return (
        <select className={base} value={form[f.name] || ''} onChange={(ev) => setForm({ ...form, [f.name]: ev.target.value })}>
          <option value="">-- selectionner --</option>
          {opts.map((o) =>
            f.options ? (
              <option key={o.value} value={o.value}>{o.label}</option>
            ) : (
              <option key={o[f.valueKey]} value={o[f.valueKey]}>{o[f.labelKey]}</option>
            )
          )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className={`px-7 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r ${mod.gradient}`}>
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'Modifier' : 'Nouveau'} - {mod.title}
          </h2>
          <p className="text-white/70 text-sm mt-0.5">Les donnees seront enregistrees dans Dolibarr.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mod.fields.map((f) => (
              <div key={f.name} className={f.type === 'select' && !f.options ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {input(f)}
              </div>
            ))}
          </div>

          {mod.lines && (
            <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lignes</p>
              {lineItems.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
                      value={line.productId || ''}
                      onChange={(ev) => {
                        const next = [...lineItems];
                        next[idx] = { ...next[idx], productId: ev.target.value };
                        setLineItems(next);
                      }}
                    >
                      <option value="">-- produit --</option>
                      {(optionsCache._products || []).map((o) => (
                        <option key={o.id} value={o.id}>{o.ref} - {o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" step="1" min="1"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
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
                      type="number" step="0.01"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm dark:bg-slate-900 dark:text-slate-100"
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Enregistrer dans Dolibarr'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ErpModule;
