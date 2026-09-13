import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as subsService from '../../services/billingSubscriptionsMockService';
import './BillingPage.css';

const LIFECYCLE = ['DRAFT', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCEL_PENDING', 'CANCELLED', 'EXPIRED'];

function SubscriptionsPage() {
  const { toast, showToast } = useToast();
  const [subs, setSubs] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLabel, setActionLabel] = useState('');
  const reasonRef = useRef(null);

  useEffect(() => {
    setSubs(subsService.listSubscriptions());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedSub(row);
    setDetailOpen(true);
  }, []);

  const confirmFn = useCallback(() => {
    if (!confirmAction || !selectedSub) return;
    let updated = null;
    if (confirmAction.type === 'changePlan') {
      updated = subsService.updateSubscription(selectedSub.id, { planCode: confirmAction.planCode, planName: confirmAction.planName, updatedAt: new Date().toISOString().slice(0, 10) });
    } else if (confirmAction.type === 'suspend') {
      updated = subsService.changeSubscriptionStatus(selectedSub.id, 'SUSPENDED');
    } else if (confirmAction.type === 'resume') {
      updated = subsService.changeSubscriptionStatus(selectedSub.id, 'ACTIVE');
    } else if (confirmAction.type === 'cancel') {
      updated = subsService.changeSubscriptionStatus(selectedSub.id, 'CANCELLED');
    }
    if (updated) {
      setSubs(subsService.listSubscriptions());
      setSelectedSub(updated);
      showToast(`${actionLabel} avec succès`);
    }
    setConfirmOpen(false);
    setConfirmAction(null);
    setActionLabel('');
  }, [confirmAction, selectedSub, actionLabel, showToast]);

  const columns = useMemo(() => [
    { key: 'tenantName', label: 'Tenant', width: '14rem' },
    { key: 'planCode', label: 'Plan', width: '8rem' },
    { key: 'status', label: 'Statut', width: '11rem', render: (v) => <StatusBadge status={v} /> },
    { key: 'currentPeriodStart', label: 'Période courante', width: '18rem', render: (v, row) => v && row?.currentPeriodEnd ? `${v} → ${row.currentPeriodEnd}` : '—' },
    { key: 'autoRenewal', label: 'Renouvellement auto', width: '12rem', render: (v) => v ? 'Oui' : 'Non' },
  ], []);

  const availableActions = (status) => {
    if (status === 'DRAFT') return [{ key: 'changePlan', label: 'Souscrire' }, { key: 'cancel', label: 'Annuler' }];
    if (status === 'TRIAL') return [{ key: 'changePlan', label: 'Changer de plan' }, { key: 'suspend', label: 'Suspendre' }];
    if (status === 'ACTIVE') return [{ key: 'changePlan', label: 'Changer de plan' }, { key: 'suspend', label: 'Suspendre' }, { key: 'cancel', label: 'Annuler' }];
    if (status === 'PAST_DUE') return [{ key: 'resume', label: 'Reprendre' }, { key: 'cancel', label: 'Annuler' }];
    if (status === 'SUSPENDED') return [{ key: 'resume', label: 'Reprendre' }, { key: 'cancel', label: 'Annuler' }];
    if (status === 'CANCEL_PENDING') return [{ key: 'resume', label: 'Reprendre' }];
    return [];
  };

  const getPlanOptions = () => {
    return [{ code: 'FREE', name: 'Gratuit' }, { code: 'STARTER', name: 'Starter' }, { code: 'PRO', name: 'Professional' }, { code: 'ENTERPRISE', name: 'Enterprise' }];
  };

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Abonnements</span>
      </nav>
      <h1 className="billing-title">Abonnements</h1>
      <p className="billing-subtitle">Suivi des abonnements par tenant.</p>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={subs} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucun abonnement trouvé" />
      </div>
      <DetailPanel open={detailOpen} title={selectedSub ? `Abonnement : ${selectedSub?.tenantName || ''}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedSub && (
          <div className="billing-detail-grid">
            <div className="billing-detail-field"><span className="billing-detail-label">Tenant</span><span className="billing-detail-value">{selectedSub.tenantName}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Plan</span><span className="billing-detail-value">{selectedSub.planName}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={selectedSub.status} /></span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Renouvellement auto</span><span className="billing-detail-value">{selectedSub.autoRenewal ? 'Oui' : 'Non'}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Période</span><span className="billing-detail-value">{selectedSub.currentPeriodStart && selectedSub.currentPeriodEnd ? `${selectedSub.currentPeriodStart} → ${selectedSub.currentPeriodEnd}` : '—'}</span></div>
          </div>
        )}
        <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
          {selectedSub && availableActions(selectedSub.status).map((a) => (
            <button key={a.key} type="button" className="billing-btn" onClick={() => {
              if (a.key === 'changePlan') {
                const plans = getPlanOptions();
                const next = plans.find((p) => p.code !== selectedSub.planCode) || plans[0];
                setConfirmAction({ type: 'changePlan', planCode: next.code, planName: next.name });
                setActionLabel(`Changer vers ${next.name}`);
                setConfirmOpen(true);
              } else {
                setConfirmAction({ type: a.key });
                setActionLabel(a.label);
                setConfirmOpen(true);
              }
            }}>{a.label}</button>
          ))}
        </div>
      </DetailPanel>
      <ConfirmationModal
        open={confirmOpen}
        title={actionLabel}
        message={selectedSub ? `Voulez-vous ${actionLabel} l'abonnement ${selectedSub.tenantName} ?` : 'Confirmer'}
        onConfirm={confirmFn}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        danger={confirmAction?.type === 'cancel' || confirmAction?.type === 'suspend'}
      />
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default SubscriptionsPage;
