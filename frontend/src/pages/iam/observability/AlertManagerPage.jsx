import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import ConfirmModal from '../../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../../hooks/useToast.js';

const RULE_TABS = [
  { key: 'rules', label: 'Règles' },
  { key: 'instances', label: 'Instances' },
];

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'LOW'];
const STATUS_OPTIONS = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'];
const SOURCE_OPTIONS = ['ALL'];
const ENABLED_OPTIONS = ['ALL', 'true', 'false'];

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function SeverityBadge({ severity }) {
  const cfg = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700' },
    WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    LOW: { bg: 'bg-blue-100', text: 'text-blue-700' },
    INFO: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };
  const c = cfg[severity] || cfg.LOW;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{severity}</span>;
}

function StatusBadge2({ status }) {
  const cfg = {
    OPEN: { bg: 'bg-red-100', text: 'text-red-700' },
    ACKNOWLEDGED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700' },
    SUPPRESSED: { bg: 'bg-gray-100', text: 'text-gray-700' },
    INVESTIGATING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };
  const c = cfg[status] || cfg.OPEN;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{status}</span>;
}

function AlertManagerPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('rules');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [enabledFilter, setEnabledFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [rules, setRules] = useState([]);
  const [instances, setInstances] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const detailCloseRef = useRef(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await iamObservabilityService.alertRules();
      const data = response.data;
      setRules(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      {
        setLoadError("Impossible de charger les règles d'alerte.");
        toast.error('Erreur lors du chargement des règles d\'alerte.');
        setRules([]);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadInstances = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await iamObservabilityService.alertInstances();
      const data = response.data;
      setInstances(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      {
        setLoadError("Impossible de charger les instances d'alerte.");
        toast.error('Erreur lors du chargement des instances d\'alerte.');
        setInstances([]);
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRules();
    loadInstances();
  }, [loadRules, loadInstances]);

  useEffect(() => {
    setPage(1);
  }, [search, severityFilter, statusFilter, sourceFilter, enabledFilter, sortKey, sortDir, activeTab]);

  useEffect(() => {
    if (!detailItem) return undefined;

    const previousElement = document.activeElement;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setDetailItem(null);
    };

    window.addEventListener('keydown', handleEscape);
    requestAnimationFrame(() => detailCloseRef.current?.focus());

    return () => {
      window.removeEventListener('keydown', handleEscape);
      previousElement?.focus?.();
    };
  }, [detailItem]);

  const isCritical = (status, severity) => status === 'OPEN' && severity === 'CRITICAL';

  const openDetails = (item) => setDetailItem(item);

  const handleDetailRowKeyDown = (event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails(item);
    }
  };

  const filteredRules = useMemo(() => {
    let list = rules.map((r) => ({ ...r }));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => [r.code, r.sourceType, r.condition, r.scope, r.notificationPolicyRef].some((v) => String(v).toLowerCase().includes(q)));
    }
    if (severityFilter !== 'ALL') list = list.filter((r) => r.severity === severityFilter);
    if (sourceFilter !== 'ALL') list = list.filter((r) => r.sourceType === sourceFilter);
    if (enabledFilter !== 'ALL') list = list.filter((r) => String(r.enabled) === enabledFilter);
    list.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, LOW: 4 };
      const getValue = (item) => {
        if (sortKey === 'severity') return order[item.severity] ?? 9;
        if (sortKey === 'code') return item.code.toLowerCase();
        if (sortKey === 'sourceType') return item.sourceType.toLowerCase();
        if (sortKey === 'window') return item.window;
        if (sortKey === 'threshold') return item.threshold;
        if (sortKey === 'scope') return item.scope.toLowerCase();
        if (sortKey === 'enabled') return item.enabled ? 1 : 0;
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [rules, search, severityFilter, sourceFilter, enabledFilter, sortKey, sortDir]);

  const filteredInstances = useMemo(() => {
    let list = instances.map((i) => ({ ...i }));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => [i.code, i.sourceType, i.condition, i.scope, i.status, i.id].some((v) => String(v).toLowerCase().includes(q)));
    }
    if (severityFilter !== 'ALL') list = list.filter((i) => i.severity === severityFilter);
    if (statusFilter !== 'ALL') list = list.filter((i) => i.status === statusFilter);
    if (sourceFilter !== 'ALL') list = list.filter((i) => i.sourceType === sourceFilter);
    list.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, LOW: 4 };
      const statusOrder = { OPEN: 0, ACKNOWLEDGED: 1, RESOLVED: 2, SUPPRESSED: 3, INVESTIGATING: 4 };
      const getValue = (item) => {
        if (sortKey === 'severity') return order[item.severity] ?? 9;
        if (sortKey === 'status') return statusOrder[item.status] ?? 9;
        if (sortKey === 'code') return item.code.toLowerCase();
        if (sortKey === 'sourceType') return item.sourceType.toLowerCase();
        if (sortKey === 'triggeredAt') return new Date(item.triggeredAt).getTime();
        if (sortKey === 'scope') return item.scope.toLowerCase();
        return 0;
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [instances, search, severityFilter, statusFilter, sourceFilter, sortKey, sortDir]);

  const currentList = activeTab === 'rules' ? filteredRules : filteredInstances;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const pageItems = currentList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRefresh = () => {
    loadRules();
    loadInstances();
    toast.success('Alertes actualisées.');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setEnabledFilter('ALL');
    setSortKey('severity');
    setSortDir('desc');
    setPage(1);
    toast.success('Filtres réinitialisés.');
  };

  const handleRequestAction = (item, action) => {
    setActionTarget({ item, action });
    if (isCritical(item.status, item.severity) && action !== 'toggleEnabled') {
      setConfirmAction(action);
    } else {
      applyAction(item, action);
    }
  };

  const handleConfirmCritical = async () => {
    if (!actionTarget || !confirmAction) return;
    await applyAction(actionTarget.item, actionTarget.action);
    setConfirmAction(null);
    setActionTarget(null);
  };

  const applyAction = async (item, action) => {
    try {
      if (activeTab === 'rules') {
        await iamObservabilityService.toggleAlertRule(item.id, { enabled: !item.enabled });
        setRules(prev => prev.map(r => r.id === item.id ? { ...r, enabled: !r.enabled } : r));
      } else {
        const status = { ack: 'ACKNOWLEDGED', resolve: 'RESOLVED', suppress: 'SUPPRESSED' }[action];
        await iamObservabilityService.updateAlertInstance(item.id, { status });
        setInstances(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
      }
      toast.success('Action enregistrée.');
      setDetailItem(null);
      setActionTarget(null);
    } catch {
      toast.error('Action non enregistrée.');
    }
  };

  const getActionLabel = (action) => {
    if (!action) return 'confirmer';
    if (action === 'ack') return 'acquitter';
    if (action === 'resolve') return 'résoudre';
    if (action === 'suppress') return 'supprimer';
    if (action === 'toggleEnabled') return actionTarget?.item?.enabled ? 'désactiver' : 'activer';
    return 'confirmer';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Observability & Security</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Alert Manager</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Alert Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Gérez les règles et les instances d'alertes.</p>
      </div>

      {loadError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => { loadRules(); loadInstances(); }}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100"
          >
            Réessayer
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Alertes" className="flex gap-1 border-b border-slate-200 mb-4">
        {RULE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            id={`alert-tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls="alert-results"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <input
            type="text"
            aria-label="Rechercher une alerte"
            placeholder="Rechercher un code, une condition, un scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select aria-label="Filtrer par sévérité" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Toutes sév.' : s}</option>)}
        </select>
        {activeTab === 'instances' && (
          <select aria-label="Filtrer par statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Tous statuts' : s}</option>)}
          </select>
        )}
        <select aria-label="Filtrer par source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'Toutes sources' : s}</option>)}
        </select>
        {activeTab === 'rules' && (
          <select aria-label="Filtrer par activation" value={enabledFilter} onChange={(e) => setEnabledFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            {ENABLED_OPTIONS.map((e) => <option key={e} value={e}>{e === 'ALL' ? 'Tous' : e === 'true' ? 'Activées' : 'Désactivées'}</option>)}
          </select>
        )}
        <select aria-label="Trier par" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          {activeTab === 'rules' ? (
            <>
              <option value="severity">Sévérité</option>
              <option value="code">Code</option>
              <option value="sourceType">Source</option>
              <option value="window">Fenêtre</option>
              <option value="threshold">Seuil</option>
              <option value="scope">Scope</option>
              <option value="enabled">Activée</option>
            </>
          ) : (
            <>
              <option value="severity">Sévérité</option>
              <option value="status">Statut</option>
              <option value="code">Code</option>
              <option value="sourceType">Source</option>
              <option value="triggeredAt">Déclenchée</option>
              <option value="scope">Scope</option>
            </>
          )}
        </select>
        <select aria-label="Sens du tri" value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="asc">Croissant</option>
          <option value="desc">Décroissant</option>
        </select>
        <button type="button" onClick={handleRefresh} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">
          <RefreshCw className="w-4 h-4 inline mr-1" />Actualiser
        </button>
        <button type="button" onClick={handleResetFilters} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 border border-slate-300 rounded-lg">Réinitialiser</button>
      </div>

      <div id="alert-results" role="tabpanel" aria-labelledby={`alert-tab-${activeTab}`} className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {activeTab === 'rules' ? (
                <>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Sévérité</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Condition</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Fenêtre</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Seuil</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Scope</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Activée</th>
                </>
              ) : (
                <>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Sévérité</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Condition</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Valeur</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Déclenchée</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {currentList.length === 0 && (
              <tr><td colSpan={activeTab === 'rules' ? 8 : 7} className="px-4 py-8 text-center text-slate-500">Aucune donnée à afficher.</td></tr>
            )}
            {pageItems.map((item) => (
              <tr
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`Voir le détail de ${item.code}`}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:bg-blue-50"
                onClick={() => openDetails(item)}
                onKeyDown={(event) => handleDetailRowKeyDown(event, item)}
              >
                <td className="px-4 py-3 text-slate-900 font-medium">{item.code}</td>
                <td className="px-4 py-3 text-slate-600">{item.sourceType}</td>
                <td className="px-4 py-3"><SeverityBadge severity={item.severity} /></td>
                {activeTab === 'rules' ? (
                  <>
                    <td className="px-4 py-3 text-slate-600">{item.condition}</td>
                    <td className="px-4 py-3 text-slate-600">{item.window}</td>
                    <td className="px-4 py-3 text-slate-600">{item.threshold}</td>
                    <td className="px-4 py-3 text-slate-600">{item.scope}</td>
                    <td className="px-4 py-3">
                      <button type="button" className={`text-xs font-medium ${item.enabled ? 'text-green-700' : 'text-red-700'}`} onClick={(e) => { e.stopPropagation(); handleRequestAction(item, 'toggleEnabled'); }}>
                        {item.enabled ? 'Oui' : 'Non'}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3"><StatusBadge2 status={item.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{item.condition}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.currentValue}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.triggeredAt)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentList.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 text-sm text-slate-600">
          <span>Page {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Page précédente" className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" aria-current={p === page ? 'page' : undefined} className={`px-3 py-1 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button type="button" aria-label="Page suivante" className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailItem(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-detail-title"
            className="w-full max-w-2xl rounded-[var(--radius-xl)] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 id="alert-detail-title" className="text-lg font-semibold text-slate-900">
                {activeTab === 'rules' ? 'Détail de la règle' : 'Détail de l\'instance'}
              </h2>
              <button ref={detailCloseRef} type="button" aria-label="Fermer le détail" onClick={() => setDetailItem(null)} className="rounded-md p-1 text-xl text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs font-medium text-slate-500">Code</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.code}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Source</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.sourceType}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Condition</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.condition}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Sévérité</span><div className="mt-0.5"><SeverityBadge severity={detailItem.severity} /></div></div>
                <div><span className="text-xs font-medium text-slate-500">Fenêtre</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.window}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Seuil</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.threshold}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Cooldown</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.cooldown}</p></div>
                <div><span className="text-xs font-medium text-slate-500">Scope</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.scope}</p></div>
                {activeTab === 'rules' ? (
                  <>
                    <div><span className="text-xs font-medium text-slate-500">Activée</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.enabled ? 'Oui' : 'Non'}</p></div>
                    <div><span className="text-xs font-medium text-slate-500">NotificationPolicy</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.notificationPolicyRef}</p></div>
                    <div className="col-span-2 flex gap-2 pt-2">
                      <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={() => { setDetailItem(null); handleRequestAction(detailItem, 'toggleEnabled'); }}>
                        {detailItem.enabled ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div><span className="text-xs font-medium text-slate-500">Statut</span><div className="mt-0.5"><StatusBadge2 status={detailItem.status} /></div></div>
                    <div><span className="text-xs font-medium text-slate-500">Valeur actuelle</span><p className="text-sm text-slate-900 mt-0.5">{detailItem.currentValue}</p></div>
                    <div><span className="text-xs font-medium text-slate-500">Déclenchée le</span><p className="text-sm text-slate-900 mt-0.5">{formatDate(detailItem.triggeredAt)}</p></div>
                    <div><span className="text-xs font-medium text-slate-500">Acquittée le</span><p className="text-sm text-slate-900 mt-0.5">{formatDate(detailItem.acknowledgedAt)}</p></div>
                    <div><span className="text-xs font-medium text-slate-500">Résolue le</span><p className="text-sm text-slate-900 mt-0.5">{formatDate(detailItem.resolvedAt)}</p></div>
                    <div className="col-span-2 flex gap-2 pt-2">
                      {detailItem.status === 'OPEN' && (
                        <button type="button" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={() => { setDetailItem(null); handleRequestAction(detailItem, 'ack'); }}>Acquitter</button>
                      )}
                      {(detailItem.status === 'OPEN' || detailItem.status === 'ACKNOWLEDGED') && (
                        <button type="button" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700" onClick={() => { setDetailItem(null); handleRequestAction(detailItem, 'suppress'); }}>Supprimer</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction && !!actionTarget}
        title={isCritical(actionTarget?.item?.status, actionTarget?.item?.severity) ? 'Action critique' : 'Confirmation'}
        message={`Voulez-vous ${getActionLabel(confirmAction)} cette alerte ?`}
        confirmLabel={confirmAction === 'toggleEnabled' ? (actionTarget?.item?.enabled ? 'Désactiver' : 'Activer') : 'Confirmer'}
        danger={isCritical(actionTarget?.item?.status, actionTarget?.item?.severity)}
        onCancel={() => { setConfirmAction(null); setActionTarget(null); }}
        onConfirm={handleConfirmCritical}
      />
    </div>
  );
}

export default AlertManagerPage;
