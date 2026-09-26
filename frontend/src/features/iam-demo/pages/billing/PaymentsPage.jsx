import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import { Timeline } from '../../components/observability/Timeline';
import * as paymentsService from '../../services/billingPaymentsMockService';
import './BillingPage.css';

function PaymentsPage() {
  const { toast, showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setPayments(paymentsService.listPayments());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedPayment(row);
    setDetailOpen(true);
  }, []);

  const confirmFn = useCallback(() => {
    if (!confirmAction || !selectedPayment) return;
    if (confirmAction.type === 'refund') {
      const updated = paymentsService.refundPayment(selectedPayment.id);
      if (updated) {
        setPayments(paymentsService.listPayments());
        setSelectedPayment(updated);
        showToast('Paiement remboursé avec succès');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  }, [confirmAction, selectedPayment, showToast]);

  const columns = useMemo(() => [
    { key: 'reference', label: 'Référence', width: '12rem' },
    { key: 'provider', label: 'Provider', width: '10rem' },
    { key: 'amount', label: 'Montant', width: '9rem', render: (v, row) => `${v.toFixed(2)} ${row?.currency || 'EUR'}` },
    { key: 'status', label: 'Statut', width: '14rem', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: 'Date', width: '12rem' },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Paiements</span>
      </nav>
      <h1 className="billing-title">Paiements</h1>
      <p className="billing-subtitle">Historique des paiements et timeline d'événements.</p>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={payments} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucun paiement trouvé" />
      </div>
      <DetailPanel open={detailOpen} title={selectedPayment ? `Paiement : ${selectedPayment?.reference || ''}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedPayment && (
          <>
            <div className="billing-detail-grid">
              <div className="billing-detail-field"><span className="billing-detail-label">Référence</span><span className="billing-detail-value">{selectedPayment.reference}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Provider</span><span className="billing-detail-value">{selectedPayment.provider}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Montant</span><span className="billing-detail-value">{selectedPayment.amount.toFixed(2)} {selectedPayment.currency}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={selectedPayment.status} /></span></div>
            </div>
            <div className="billing-section" style={{ marginTop: '1rem' }}>
              <h3 className="billing-section-title">Timeline</h3>
              {selectedPayment.timeline && selectedPayment.timeline.length > 0 ? (
                <Timeline items={selectedPayment.timeline} renderItem={(item) => (
                  <div className="billing-timeline-item">
                    <span className="billing-timeline-event">{item.event}</span>
                    <span className="billing-timeline-time">{item.timestamp}</span>
                  </div>
                )} />
              ) : <span>Aucun événement</span>}
            </div>
          </>
        )}
        <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
          {selectedPayment && selectedPayment.status !== 'REFUNDED' && selectedPayment.status !== 'CANCELLED' && (
            <button type="button" className="billing-btn billing-btn-danger" onClick={() => { setConfirmAction({ type: 'refund' }); setConfirmOpen(true); }}>Rembourser</button>
          )}
        </div>
      </DetailPanel>
      <ConfirmationModal
        open={confirmOpen}
        title="Rembourser le paiement"
        message={selectedPayment ? `Voulez-vous rembourser le paiement ${selectedPayment.reference} ? Aucune donnée réelle de carte n'est utilisée (tok_mock_xxx).` : 'Confirmer'}
        onConfirm={confirmFn}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        danger
      />
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default PaymentsPage;
