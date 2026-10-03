import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsRightLeftIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUpIcon,
  ClockIcon,
  CubeTransparentIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { syncService, connectorService } from '../services/apiClient.js';
import { useToast } from '../hooks/useToast.js';
import { TableSkeleton } from '../components/Loaders.jsx';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

const STATUS_STYLES = {
  PENDING: ['bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'],
  RUNNING: ['bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700'],
  SUCCEEDED: ['bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'],
  PARTIAL: ['bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700'],
  FAILED: ['bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700'],
  PAUSED: ['bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700'],
  CANCELLED: ['bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'],
};

const STATUS_LABELS = {
  PENDING: 'En attente',
  RUNNING: 'En cours',
  SUCCEEDED: 'Réussie',
  PARTIAL: 'Partielle',
  FAILED: 'Échouée',
  PAUSED: 'Pause',
  CANCELLED: 'Annulée',
};

const DIRECTION_ICONS = {
  PULL: ArrowDownIcon,
  PUSH: ArrowUpIcon,
  BIDIRECTIONAL: ArrowsRightLeftIcon,
};

const MODE_LABELS = {
  FULL: 'Complète',
  INCREMENTAL: 'Incrémentale',
};

function StatusBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-400 dark:text-slate-500">—</span>;
  const upper = String(value).toUpperCase();
  const styles = STATUS_STYLES[upper] || STATUS_STYLES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[0]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[upper] || value}
    </span>
  );
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function availableActions(sync) {
  const status = sync.status;
  const actions = [];
  if (['PENDING', 'FAILED', 'SUCCEEDED', 'PARTIAL', 'CANCELLED'].includes(status)) {
    actions.push({ name: 'run', label: 'Démarrer', icon: PlayIcon });
  }
  if (status === 'RUNNING') {
    actions.push({ name: 'pause', label: 'Pause', icon: PauseIcon });
    actions.push({ name: 'cancel', label: 'Annuler', icon: StopIcon });
  }
  if (status === 'PAUSED' || status === 'FAILED') {
    actions.push({ name: 'resume', label: 'Reprendre', icon: PlayIcon });
  }
  return actions;
}

const ACTION_SERVICE = {
  run: syncService.run,
  pause: syncService.pause,
  resume: syncService.resume,
  cancel: syncService.cancel,
};

const ACTION_COLORS = {
  run: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
  resume: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
  pause: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50',
  cancel: 'text-red-600 hover:text-red-700 hover:bg-red-50',
};

export default function ErpSynchronizations() {
  const { activeTenant } = useTenant();
  const { user } = useAuth();
  const canWrite = user?.permissions?.some((p) => p === '*' || p === 'erp:write');
  const { toast } = useToast();
  const [syncs, setSyncs] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [checkpoint, setCheckpoint] = useState(null);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const requestRef = useRef(null);

  const fetchSyncs = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await syncService.list({ signal: controller.signal });
      setSyncs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    return () => controller.abort();
  }, []);

  const fetchConnectors = useCallback(async () => {
    try {
      const response = await connectorService.list();
      setConnectors(Array.isArray(response.data) ? response.data : []);
    } catch {
      setConnectors([]);
    }
  }, []);

  useEffect(() => {
    const cleanup = fetchSyncs();
    fetchConnectors();
    return () => { cleanup?.(); };
  }, [fetchSyncs, fetchConnectors, activeTenant?.id]);

  const runAction = async (actionFn, sync, actionName) => {
    if (actionLoading[sync.id]) return;
    setActionLoading((prev) => ({ ...prev, [sync.id]: actionName }));
    try {
      await actionFn(sync.id);
      const actionLabel = actionName === 'run' ? 'Démarrage' : actionName === 'resume' ? 'Reprise' : actionName === 'pause' ? 'Mise en pause' : 'Annulation';
      toast.success(`${actionLabel} de « ${sync.code} ».`);
      fetchSyncs();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || `Action impossible sur « ${sync.code} ».`);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[sync.id];
        return next;
      });
    }
  };

  const handleDelete = async (sync) => {
    if (!confirm(`Supprimer la synchronisation « ${sync.code} » ? Cette action est irréversible.`)) return;
    setActionLoading((prev) => ({ ...prev, [`delete-${sync.id}`]: 'delete' }));
    try {
      await syncService.remove(sync.id);
      setSyncs((prev) => prev.filter((s) => s.id !== sync.id));
      toast.success(`« ${sync.code} » supprimée.`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Suppression impossible.');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[`delete-${sync.id}`];
        return next;
      });
    }
  };

  const handleCheckpoint = async (sync) => {
    setCheckpointOpen(true);
    setCheckpoint({ loading: true, data: null, error: null });
    try {
      const response = await syncService.checkpoint(sync.id);
      setCheckpoint({ loading: false, data: response.data, error: null });
    } catch (err) {
      setCheckpoint({ loading: false, data: null, error: err });
    }
  };

  const connectorName = (sync) => sync.connector?.name || connectors.find((c) => c.id === sync.connectorId)?.name || '—';

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Synchronisations ERP</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Gestion des synchronisations entre Dolibarr et la plateforme Techzone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSyncs}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Actualiser"
          >
            <ArrowPathRoundedSquareIcon className="w-4 h-4" /> Actualiser
          </button>
          {canWrite && (
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-[#5469D4]/25 transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5" /> Nouvelle synchronisation
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-red-600 font-medium">Impossible de charger les synchronisations</p>
            <p className="text-sm text-red-600/80">{error.response?.data?.message || error.message}</p>
          </div>
        </div>
      )}

      {syncs.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center mb-4">
            <ArrowPathIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">Aucune synchronisation configurée</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Créez une synchronisation pour lier votre ERP à la plateforme.
          </p>
          {canWrite && (
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5" /> Créer une synchronisation
            </button>
          )}
        </div>
      )}

      {syncs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Code</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Connecteur</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Source → Cible</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sens</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mode</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Statut</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Planif.</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {syncs.map((sync) => {
                  const status = sync.status;
                  const busy = actionLoading[sync.id];
                  const DirIcon = sync.direction && DIRECTION_ICONS[sync.direction] ? DIRECTION_ICONS[sync.direction] : ArrowsRightLeftIcon;
                  return (
                    <tr key={sync.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-sm">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700/40 px-2 py-1 rounded">{sync.code}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <CubeTransparentIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-200">{connectorName(sync)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span>{sync.source || '—'}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">→ {sync.target || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <DirIcon className="w-4 h-4" />
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{MODE_LABELS[sync.mode] || sync.mode || '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <StatusBadge value={status} />
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                        {sync.schedule || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {sync.status === 'RUNNING' && (
                            <ClockIcon className="w-4 h-4 text-blue-500 animate-pulse" title="Synchronisation en cours" />
                          )}
                          {availableActions(sync).map((action) => (
                            <button
                              key={action.name}
                              onClick={() => runAction(ACTION_SERVICE[action.name], sync, action.name)}
                              disabled={Boolean(busy)}
                              title={action.label}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${ACTION_COLORS[action.name] || ''}`}
                            >
                              {busy ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <action.icon className="w-4 h-4" />
                              )}
                            </button>
                          ))}
                          {(sync.status === 'RUNNING' || sync.status === 'PAUSED') && (
                            <button
                              onClick={() => handleCheckpoint(sync)}
                              disabled={Boolean(busy)}
                              title="Point de contrôle"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ClockIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditing(sync); setShowModal(true); }}
                            disabled={Boolean(busy)}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleDelete(sync)}
                              disabled={sync.status === 'RUNNING' || Boolean(actionLoading[`delete-${sync.id}`])}
                              title={sync.status === 'RUNNING' ? 'Impossible de supprimer pendant une exécution' : 'Supprimer'}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading[`delete-${sync.id}`] ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <TrashIcon className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{syncs.length} synchronisation(s)</span>
            <span className="inline-flex items-center gap-1">
              <CubeTransparentIcon className="w-3.5 h-3.5" />
              Module ERP / Dolibarr · Données en temps réel
            </span>
          </div>
        </div>
      )}

      <Link to="/erps" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
        <ArrowLeftIcon className="w-3.5 h-3.5" /> Gérer les connexions ERP
      </Link>

      {showModal && (
        <SyncForm
          connectors={connectors}
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchSyncs(); }}
        />
      )}

      {checkpointOpen && checkpoint && (
        <CheckpointDialog
          sync={checkpoint}
          onClose={() => { setCheckpointOpen(false); setCheckpoint(null); }}
        />
      )}
    </div>
  );
}

function SyncForm({ connectors, editing, onClose, onSaved }) {
  const { toast } = useToast();
  const isEditing = !!editing;
  const activeConnectors = connectors.filter((c) => c.status === 'ACTIVE');
  const [form, setForm] = useState({
    code: '',
    connectorId: '',
    source: '',
    target: '',
    direction: 'PULL',
    mode: 'INCREMENTAL',
    schedule: '',
    mappingRef: '',
    batchSize: 100,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      setForm({
        code: editing.code || '',
        connectorId: editing.connectorId || '',
        source: editing.source || '',
        target: editing.target || '',
        direction: editing.direction || 'PULL',
        mode: editing.mode || 'INCREMENTAL',
        schedule: editing.schedule || '',
        mappingRef: editing.mappingRef || '',
        batchSize: editing.batchSize || 100,
      });
    }
  }, [editing, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.connectorId) {
      setFormError('Le code et le connecteur sont obligatoires.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        await syncService.update(editing.id, {
          code: form.code,
          source: form.source,
          target: form.target,
          direction: form.direction,
          mode: form.mode,
          schedule: form.schedule || null,
          mappingRef: form.mappingRef || null,
          batchSize: form.batchSize,
        });
      } else {
        await syncService.create({
          code: form.code,
          connectorId: form.connectorId,
          source: form.source,
          target: form.target,
          direction: form.direction,
          mode: form.mode,
          schedule: form.schedule || undefined,
          mappingRef: form.mappingRef || undefined,
          batchSize: form.batchSize,
        });
      }
      toast.success(isEditing ? `« ${form.code} » mise à jour.` : `« ${form.code} » créée.`);
      onSaved();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={onClose}>
        <form className="space-y-6 p-7" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isEditing ? 'Modifier' : 'Nouvelle'} synchronisation
            </h2>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-600">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Code *</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                disabled={isEditing || saving}
                placeholder="ex: sync-clients-dolibarr"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Connecteur *</label>
              <select
                name="connectorId"
                value={form.connectorId}
                onChange={handleChange}
                required
                disabled={saving || activeConnectors.length === 0}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
              >
                <option value="">Sélectionner un connecteur</option>
                {activeConnectors.length === 0 && <option value="" disabled>Aucun connecteur actif</option>}
                {activeConnectors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Source</label>
              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                disabled={saving}
                placeholder="ex: dolibarr.thirdparty"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Cible</label>
              <input
                type="text"
                name="target"
                value={form.target}
                onChange={handleChange}
                disabled={saving}
                placeholder="ex: techzone.clients"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sens</label>
              <select name="direction" value={form.direction} onChange={handleChange} disabled={saving} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4]">
                <option value="PULL">Pull</option>
                <option value="PUSH">Push</option>
                <option value="BIDIRECTIONAL">Bidirectionnel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mode</label>
              <select name="mode" value={form.mode} onChange={handleChange} disabled={saving} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4]">
                <option value="INCREMENTAL">Incrémental</option>
                <option value="FULL">Complet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Batch</label>
              <input
                type="number"
                name="batchSize"
                value={form.batchSize}
                onChange={handleChange}
                disabled={saving}
                min="1"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Planification (cron)</label>
            <input
              type="text"
              name="schedule"
              value={form.schedule}
              onChange={handleChange}
              disabled={saving}
              placeholder="ex: 0 * * * * (toutes les heures)"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Optionnel. Laissez vide pour un déclenchement manuel uniquement.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mapping de référence</label>
            <input
              type="text"
              name="mappingRef"
              value={form.mappingRef}
              onChange={handleChange}
              disabled={saving}
              placeholder="ex: mapping-clients-v1"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5469D4]/30 focus:border-[#5469D4] disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5469D4] hover:bg-[#3B4BA8] text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckpointDialog({ sync, onClose }) {
  const { loading, data, error } = sync;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Point de contrôle</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <ArrowPathRoundedSquareIcon className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-600">{error.response?.data?.message || error.message}</p>
            </div>
          )}
          {data && (
            <div className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Étape</dt>
                <dd className="text-slate-700 dark:text-slate-200 mt-0.5">{data.step || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Position</dt>
                <dd className="text-slate-700 dark:text-slate-200 mt-0.5">{data.position ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Horodatage</dt>
                <dd className="text-slate-700 dark:text-slate-200 mt-0.5">{fmtDate(data.timestamp)}</dd>
              </div>
              {data.data && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">Données</dt>
                  <dd className="mt-0.5">
                    <pre className="text-xs bg-slate-50 dark:bg-slate-700/40 rounded-lg p-3 overflow-x-auto break-all">
                      {JSON.stringify(data.data, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
