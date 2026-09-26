import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../components/observability/useToast';
import { SearchBar } from '../../components/observability/SearchBar';
import { FilterBar } from '../../components/observability/FilterBar';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { SeverityBadge } from '../../components/observability/SeverityBadge';
import {
  obsAlertRules,
  obsAlertInstances,
  obsAlertSources,
} from '../../data/observability/alertsMock';
import './AlertManagerPage.css';

const RULE_TABS = [
  { key: 'rules', label: 'Règles' },
  { key: 'instances', label: 'Instances' },
];

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'LOW'];
const STATUS_OPTIONS = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'];
const SOURCE_OPTIONS = ['ALL', ...obsAlertSources];
const ENABLED_OPTIONS = ['ALL', 'true', 'false'];

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function isCritical(status, severity) {
  return status === 'OPEN' && severity === 'CRITICAL';
}

function AlertManagerPage() {
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState('rules');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [enabledFilter, setEnabledFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const [rules, setRules] = useState(obsAlertRules);
  const [instances, setInstances] = useState(obsAlertInstances);

  const [detailItem, setDetailItem] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [search, severityFilter, statusFilter, sourceFilter, enabledFilter, sortKey, sortDir, activeTab]);

  const filteredRules = useMemo(() => {
    let list = rules.map((r) => ({ ...r }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        [r.code, r.sourceType, r.condition, r.scope, r.notificationPolicyRef]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (severityFilter !== 'ALL') {
      list = list.filter((r) => r.severity === severityFilter);
    }
    if (sourceFilter !== 'ALL') {
      list = list.filter((r) => r.sourceType === sourceFilter);
    }
    if (enabledFilter !== 'ALL') {
      list = list.filter((r) => String(r.enabled) === enabledFilter);
    }

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
      list = list.filter((i) =>
        [i.code, i.sourceType, i.condition, i.scope, i.status, i.id]
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (severityFilter !== 'ALL') {
      list = list.filter((i) => i.severity === severityFilter);
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (sourceFilter !== 'ALL') {
      list = list.filter((i) => i.sourceType === sourceFilter);
    }

    list.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, LOW: 4 };
      const statusOrder = { OPEN: 0, ACKNOWLEDGED: 1, RESOLVED: 2, SUPPRESSED: 3 };
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

  const ruleColumns = useMemo(
    () => [
      { key: 'code', label: 'Code', width: '12rem' },
      { key: 'sourceType', label: 'Source', width: '11rem' },
      {
        key: 'severity',
        label: 'Sévérité',
        render: (value) => <SeverityBadge severity={value} />,
      },
      { key: 'condition', label: 'Condition' },
      { key: 'window', label: 'Fenêtre', width: '6rem' },
      { key: 'threshold', label: 'Seuil', width: '6rem' },
      { key: 'scope', label: 'Scope', width: '10rem' },
      {
        key: 'enabled',
        label: 'Activée',
        width: '6rem',
        render: (value) => (
          <span className={`obs-alert-enabled ${value ? 'obs-alert-enabled-on' : 'obs-alert-enabled-off'}`}>
            {value ? 'Oui' : 'Non'}
          </span>
        ),
      },
    ],
    []
  );

  const instanceColumns = useMemo(
    () => [
      { key: 'code', label: 'Code', width: '12rem' },
      { key: 'sourceType', label: 'Source', width: '11rem' },
      {
        key: 'severity',
        label: 'Sévérité',
        render: (value) => <SeverityBadge severity={value} />,
      },
      {
        key: 'status',
        label: 'Statut',
        render: (value) => <StatusBadge status={value} />,
      },
      { key: 'condition', label: 'Condition' },
      { key: 'currentValue', label: 'Valeur', width: '8rem' },
      { key: 'triggeredAt', label: 'Déclenchée', width: '10rem', render: (v) => formatDate(v) },
    ],
    []
  );

  const handleRequestAction = (item, action) => {
    setActionTarget({ item, action });
    if (isCritical(item.status, item.severity) && action !== 'toggleEnabled') {
      setConfirmAction(action);
    } else {
      applyAction(item, action);
    }
  };

  const handleConfirmCritical = () => {
    if (!actionTarget || !confirmAction) return;
    applyAction(actionTarget.item, actionTarget.action);
    setConfirmAction(null);
    setActionTarget(null);
  };

  const applyAction = (item, action) => {
    if (activeTab === 'rules') {
      setRules((prev) =>
        prev.map((r) => {
          if (r.id !== item.id) return r;
          if (action === 'toggleEnabled') {
            showToast(`Règle ${r.code} ${r.enabled ? 'désactivée' : 'activée'}`);
            return { ...r, enabled: !r.enabled };
          }
          return r;
        })
      );
    } else {
      setInstances((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          let status = i.status;
          if (action === 'ack') {
            status = 'ACKNOWLEDGED';
            showToast(`Alerte ${i.code} acquittée`);
          } else if (action === 'resolve') {
            status = 'RESOLVED';
            showToast(`Alerte ${i.code} résolue`);
          } else if (action === 'suppress') {
            status = 'SUPPRESSED';
            showToast(`Alerte ${i.code} supprimée`);
          }
          return { ...i, status };
        })
      );
    }

    setDetailItem(null);
    setActionTarget(null);
  };

  const handleToggleEnabled = (rule) => {
    handleRequestAction(rule, 'toggleEnabled');
  };

  const getActionLabel = (action) => {
    if (action === 'ack') return 'acquitter';
    if (action === 'resolve') return 'résoudre';
    if (action === 'suppress') return 'supprimer';
    if (action === 'toggleEnabled') return actionTarget?.item?.enabled ? 'désactiver' : 'activer';
    return 'confirmer';
  };

  return (
    <div className="obs-page">
      <nav className="obs-breadcrumb">
        <span>Observability & Security</span>
        <span className="obs-breadcrumb-sep">/</span>
        <span className="obs-breadcrumb-current">Alert Manager</span>
      </nav>

      <div className="obs-header">
        <div className="obs-header-left">
          <div className="obs-title-row">
            <h1 className="obs-title">Alert Manager</h1>
          </div>
          <p className="obs-subtitle">
            Gérez les règles et les instances d'alertes.
          </p>
        </div>
      </div>

      <div className="obs-tabs" role="tablist" aria-label="Vue Alert Manager">
        {RULE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`obs-tab ${activeTab === tab.key ? 'obs-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="obs-toolbar">
        <div className="obs-toolbar-left">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un code, une condition, un scope…"
          />
        </div>
        <div className="obs-toolbar-right">
          <FilterBar
            filters={SEVERITY_OPTIONS.map((s) => ({ key: s, label: s === 'ALL' ? 'Toutes sév.' : s }))}
            activeFilter={severityFilter}
            onFilterChange={setSeverityFilter}
          />
          {activeTab === 'instances' && (
            <FilterBar
              filters={STATUS_OPTIONS.map((s) => ({ key: s, label: s === 'ALL' ? 'Tous statuts' : s }))}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
          )}
          <FilterBar
            filters={SOURCE_OPTIONS.map((s) => ({ key: s, label: s === 'ALL' ? 'Toutes sources' : s }))}
            activeFilter={sourceFilter}
            onFilterChange={setSourceFilter}
          />
          {activeTab === 'rules' && (
            <FilterBar
              filters={ENABLED_OPTIONS.map((e) => ({ key: e, label: e === 'ALL' ? 'Tous' : e === 'true' ? 'Activées' : 'Désactivées' }))}
              activeFilter={enabledFilter}
              onFilterChange={setEnabledFilter}
            />
          )}
          <select
            className="obs-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
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
          <select
            className="obs-select"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </div>
      </div>

      <div className="obs-table-wrapper">
        {currentList.length === 0 ? (
          <div className="obs-table-empty">Aucune donnée à afficher.</div>
        ) : (
          <DataTable
            columns={activeTab === 'rules' ? ruleColumns : instanceColumns}
            rows={pageItems}
            rowKey="id"
            onRowClick={setDetailItem}
            emptyMessage="Aucune donnée à afficher."
          />
        )}
      </div>

      <div className="obs-pagination">
        <button
          type="button"
          className="obs-pagination-btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Précédent
        </button>
        <span className="obs-pagination-info">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="obs-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </button>
      </div>

      {detailItem && (
        <DetailPanel
          open={!!detailItem}
          title={activeTab === 'rules' ? 'Détail de la règle' : 'Détail de l\'instance'}
          onClose={() => setDetailItem(null)}
        >
          <div className="obs-detail-fields">
            {activeTab === 'rules' ? (
              <>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Code</span>
                  <span className="obs-detail-value">{detailItem.code}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Source</span>
                  <span className="obs-detail-value">{detailItem.sourceType}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Condition</span>
                  <span className="obs-detail-value">{detailItem.condition}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Sévérité</span>
                  <SeverityBadge severity={detailItem.severity} />
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Fenêtre</span>
                  <span className="obs-detail-value">{detailItem.window}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Seuil</span>
                  <span className="obs-detail-value">{detailItem.threshold}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Cooldown</span>
                  <span className="obs-detail-value">{detailItem.cooldown}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Scope</span>
                  <span className="obs-detail-value">{detailItem.scope}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Activée</span>
                  <span className={`obs-alert-enabled ${detailItem.enabled ? 'obs-alert-enabled-on' : 'obs-alert-enabled-off'}`}>
                    {detailItem.enabled ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">NotificationPolicy</span>
                  <span className="obs-detail-value">{detailItem.notificationPolicyRef}</span>
                </div>
                <div className="obs-detail-actions">
                  <button
                    type="button"
                    className="obs-btn-primary"
                    onClick={() => handleToggleEnabled(detailItem)}
                  >
                    {detailItem.enabled ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Code</span>
                  <span className="obs-detail-value">{detailItem.code}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Source</span>
                  <span className="obs-detail-value">{detailItem.sourceType}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Condition</span>
                  <span className="obs-detail-value">{detailItem.condition}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Sévérité</span>
                  <SeverityBadge severity={detailItem.severity} />
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Statut</span>
                  <StatusBadge status={detailItem.status} />
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Fenêtre</span>
                  <span className="obs-detail-value">{detailItem.window}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Seuil</span>
                  <span className="obs-detail-value">{detailItem.threshold}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Scope</span>
                  <span className="obs-detail-value">{detailItem.scope}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Valeur actuelle</span>
                  <span className="obs-detail-value">{detailItem.currentValue}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Déclenchée le</span>
                  <span className="obs-detail-value">{formatDate(detailItem.triggeredAt)}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Acquittée le</span>
                  <span className="obs-detail-value">{formatDate(detailItem.acknowledgedAt)}</span>
                </div>
                <div className="obs-detail-field">
                  <span className="obs-detail-label">Résolue le</span>
                  <span className="obs-detail-value">{formatDate(detailItem.resolvedAt)}</span>
                </div>
                <div className="obs-detail-actions">
                  {detailItem.status === 'OPEN' && (
                    <button
                      type="button"
                      className="obs-btn-primary"
                      onClick={() => handleRequestAction(detailItem, 'ack')}
                    >
                      Acquitter
                    </button>
                  )}
                  {detailItem.status === 'ACKNOWLEDGED' && (
                    <button
                      type="button"
                      className="obs-btn-primary"
                      onClick={() => handleRequestAction(detailItem, 'resolve')}
                    >
                      Résoudre
                    </button>
                  )}
                  {(detailItem.status === 'OPEN' || detailItem.status === 'ACKNOWLEDGED') && (
                    <button
                      type="button"
                      className="obs-btn-danger"
                      onClick={() => handleRequestAction(detailItem, 'suppress')}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </DetailPanel>
      )}

      <ConfirmationModal
        open={!!confirmAction && !!actionTarget}
        title={isCritical(actionTarget?.item?.status, actionTarget?.item?.severity) ? 'Action critique' : 'Confirmation'}
        message={`Voulez-vous ${getActionLabel(confirmAction)} cette alerte ?`}
        onConfirm={handleConfirmCritical}
        onCancel={() => { setConfirmAction(null); setActionTarget(null); }}
        confirmLabel={confirmAction === 'toggleEnabled' ? (actionTarget?.item?.enabled ? 'Désactiver' : 'Activer') : 'Confirmer'}
        danger={isCritical(actionTarget?.item?.status, actionTarget?.item?.severity)}
      />

      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default AlertManagerPage;
