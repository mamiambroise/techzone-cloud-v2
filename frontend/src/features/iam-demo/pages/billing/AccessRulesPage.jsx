import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as accessRulesService from '../../services/billingAccessRulesMockService';
import './BillingPage.css';

const REASON_CODES = ['NO_ACTIVE_SUBSCRIPTION', 'FEATURE_NOT_INCLUDED', 'QUOTA_EXCEEDED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_EXPIRED'];

function AccessRulesPage() {
  const { toast, showToast } = useToast();
  const [rules, setRules] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('Boutique B - Munich');
  const [selectedCapability, setSelectedCapability] = useState('users.write');
  const [decision, setDecision] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setRules(accessRulesService.listAccessRules());
  }, []);

  const tenants = ['Boutique A - Paris', 'Boutique A - Lyon', 'Boutique B - Berlin', 'Boutique B - Munich', 'Boutique C - Montreal'];
  const capabilities = ['users.read', 'users.write', 'analytics.write', 'audit.read', 'sso.configure', 'api.custom.integration'];

  const handleSimulate = useCallback(() => {
    const planCode = 'STARTER';
    const rule = rules.find((r) => r.planCode === planCode && r.capability === selectedCapability);
    if (rule) {
      setDecision(rule);
    } else {
      const deniedRule = rules.find((r) => r.capability === selectedCapability && r.decision === 'DENY');
      setDecision({
        ...(deniedRule || { planCode, capability: selectedCapability, decision: 'DENY', reasonCode: 'NO_ACTIVE_SUBSCRIPTION' }),
        reasonCode: deniedRule?.reasonCode || 'NO_ACTIVE_SUBSCRIPTION',
      });
    }
  }, [rules, selectedCapability]);

  const columns = useMemo(() => [
    { key: 'planCode', label: 'Plan', width: '10rem' },
    { key: 'capability', label: 'Capacité', width: '14rem' },
    { key: 'decision', label: 'Décision', width: '10rem', render: (v) => <span className={v === 'ALLOW' ? 'billing-badge-active' : 'billing-badge-danger'}>{v}</span> },
    { key: 'reasonCode', label: 'Raison', width: '18rem' },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Règles d'accès par plan</span>
      </nav>
      <h1 className="billing-title">Règles d'accès par plan</h1>
      <p className="billing-subtitle">Simulateur de décision et tableau des règles.</p>
      <div className="billing-section">
        <h3 className="billing-section-title">Simulateur de décision</h3>
        <div className="billing-simulator">
          <div className="billing-simulator-row">
            <span className="billing-simulator-label">Tenant :</span>
            <select className="billing-input" value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
              {tenants.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="billing-simulator-row">
            <span className="billing-simulator-label">Capability :</span>
            <select className="billing-input" value={selectedCapability} onChange={(e) => setSelectedCapability(e.target.value)}>
              {capabilities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="billing-simulator-row">
            <button type="button" className="billing-btn billing-btn-primary" onClick={handleSimulate}>Simuler</button>
          </div>
          {decision && (
            <div className={`billing-simulator-result ${decision.decision === 'ALLOW' ? 'allowed' : 'denied'}`}>
              <span className={`billing-badge ${decision.decision === 'ALLOW' ? 'billing-badge-active' : 'billing-badge-danger'}`}>{decision.decision}</span>
              <span>Plan: {decision.planCode} · Reason: {decision.reasonCode}</span>
            </div>
          )}
        </div>
      </div>
      <div className="billing-section">
        <h3 className="billing-section-title">Règles par plan</h3>
        <div className="billing-table-wrapper">
          <DataTable columns={columns} rows={rules} rowKey="id" onRowClick={(row) => { setSelectedRule(row); setDetailOpen(true); }} emptyMessage="Aucune règle trouvée" />
        </div>
      </div>
      <DetailPanel open={detailOpen} title={selectedRule ? `Règle : ${selectedRule?.planCode || ''} / ${selectedRule?.capability || ''}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedRule && (
          <div className="billing-detail-grid">
            <div className="billing-detail-field"><span className="billing-detail-label">Plan</span><span className="billing-detail-value">{selectedRule.planCode}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Capacité</span><span className="billing-detail-value">{selectedRule.capability}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Décision</span><span className="billing-detail-value"><span className={selectedRule.decision === 'ALLOW' ? 'billing-badge-active' : 'billing-badge-danger'}>{selectedRule.decision}</span></span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Raison</span><span className="billing-detail-value">{selectedRule.reasonCode}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Conditions</span><span className="billing-detail-value">{selectedRule.conditions}</span></div>
          </div>
        )}
      </DetailPanel>
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default AccessRulesPage;
