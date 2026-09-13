import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as invoicesService from '../../services/billingInvoicesMockService';
import './BillingPage.css';

function InvoicesPage() {
  const { toast, showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setInvoices(invoicesService.listInvoices());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedInvoice(row);
    setDetailOpen(true);
  }, []);

  const confirmFn = useCallback(() => {
    if (!confirmAction || !selectedInvoice) return;
    let updated = null;
    if (confirmAction.type === 'markPaid') {
      updated = invoicesService.markInvoicePaid(selectedInvoice.id);
    } else if (confirmAction.type === 'cancel') {
      updated = invoicesService.cancelInvoice(selectedInvoice.id);
    }
    if (updated) {
      setInvoices(invoicesService.listInvoices());
      setSelectedInvoice(updated);
      showToast(confirmAction.type === 'markPaid' ? 'Facture marquée payée' : 'Facture annulée');
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  }, [confirmAction, selectedInvoice, showToast]);

  const columns = useMemo(() => [
    { key: 'id', label: 'ID', width: '5rem', render: (v) => `#${v}` },
    { key: 'tenantName', label: 'Tenant', width: '14rem' },
    { key: 'periodLabel', label: 'Période', width: '12rem' },
    { key: 'amount', label: 'Montant', width: '9rem', render: (v, row) => `${v.toFixed(2)} ${row?.currency || 'EUR'}` },
    { key: 'dueDate', label: 'Échéance', width: '10rem' },
    { key: 'status', label: 'Statut', width: '12rem', render: (v) => <StatusBadge status={v} /> },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Facturation</span>
      </nav>
      <h1 className="billing-title">Facturation</h1>
      <p className="billing-subtitle">Liste des factures et leur statut.</p>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={invoices} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucune facture trouvée" />
      </div>
      <DetailPanel open={detailOpen} title={selectedInvoice ? `Facture #${selectedInvoice?.id}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedInvoice && (
          <div className="billing-detail-grid">
            <div className="billing-detail-field"><span className="billing-detail-label">ID</span><span className="billing-detail-value">#{selectedInvoice.id}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Tenant</span><span className="billing-detail-value">{selectedInvoice.tenantName}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Période</span><span className="billing-detail-value">{selectedInvoice.periodLabel}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Montant</span><span className="billing-detail-value">{selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Échéance</span><span className="billing-detail-value">{selectedInvoice.dueDate}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={selectedInvoice.status} /></span></div>
          </div>
        )}
        <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
          {selectedInvoice && selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'VOID' && (
            <button type="button" className="billing-btn billing-btn-primary" onClick={() => { setConfirmAction({ type: 'markPaid' }); setConfirmOpen(true); }}>Marquer payée</button>
          )}
          {selectedInvoice && selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'VOID' && (
            <button type="button" className="billing-btn billing-btn-danger" onClick={() => { setConfirmAction({ type: 'cancel' }); setConfirmOpen(true); }}>Annuler</button>
          )}
        </div>
      </DetailPanel>
      <ConfirmationModal
        open={confirmOpen}
        title={confirmAction?.type === 'markPaid' ? 'Marquer payée' : 'Annuler la facture'}
        message={selectedInvoice ? `Voulez-vous ${confirmAction.type === 'markPaid' ? 'marquer comme payée' : 'annuler'} la facture #${selectedInvoice.id} ?` : 'Confirmer'}
        onConfirm={confirmFn}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        danger={confirmAction?.type === 'cancel'}
      />
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default InvoicesPage;
