import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as webhooksService from '../../services/billingWebhooksMockService';
import './BillingPage.css';

function WebhooksPage() {
  const { toast, showToast } = useToast();
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    setWebhooks(webhooksService.listWebhooks());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedWebhook(row);
    setDetailOpen(true);
  }, []);

  const confirmFn = useCallback(() => {
    if (!confirmAction || !selectedWebhook) return;
    if (confirmAction.type === 'replay') {
      const updated = webhooksService.replayWebhook(selectedWebhook.id);
      if (updated) {
        setWebhooks(webhooksService.listWebhooks());
        setSelectedWebhook(updated);
        showToast('Webhook rejoué avec succès');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  }, [confirmAction, selectedWebhook, showToast]);

  const columns = useMemo(() => [
    { key: 'provider', label: 'Provider', width: '10rem' },
    { key: 'eventType', label: "Type d'événement", width: '18rem' },
    { key: 'status', label: 'Statut', width: '12rem', render: (v) => <StatusBadge status={v} /> },
    { key: 'retryCount', label: 'Tentatives', width: '8rem' },
    { key: 'timestamp', label: 'Horodatage', width: '16rem' },
  ], []);

  const signatureVerified = selectedWebhook ? (selectedWebhook.retryCount < 3) : false;

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Intégration &amp; Webhooks</span>
      </nav>
      <h1 className="billing-title">Intégration &amp; Webhooks</h1>
      <p className="billing-subtitle">Webhooks reçus et statut de traitement.</p>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={webhooks} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucun webhook trouvé" />
      </div>
      <DetailPanel open={detailOpen} title={selectedWebhook ? `Webhook : ${selectedWebhook?.eventType || ''}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedWebhook && (
          <>
            <div className="billing-detail-grid">
              <div className="billing-detail-field"><span className="billing-detail-label">Provider</span><span className="billing-detail-value">{selectedWebhook.provider}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Type d'événement</span><span className="billing-detail-value">{selectedWebhook.eventType}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={selectedWebhook.status} /></span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Tentatives</span><span className="billing-detail-value">{selectedWebhook.retryCount}</span></div>
              <div className="billing-detail-field"><span className="billing-detail-label">Horodatage</span><span className="billing-detail-value">{selectedWebhook.timestamp}</span></div>
              <div className="billing-detail-field">
                <span className="billing-detail-label">Signature vérifiée</span>
                <span className="billing-detail-value">{signatureVerified ? <span className="billing-badge-active">Oui</span> : <span className="billing-badge-danger">Non</span>}</span>
              </div>
            </div>
            <div className="billing-section" style={{ marginTop: '1rem' }}>
              <h3 className="billing-section-title">Payload (mock normalisé)</h3>
              <pre className="billing-pre" style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.75rem', overflow: 'auto' }}>
                {JSON.stringify(selectedWebhook.payload, null, 2)}
              </pre>
            </div>
          </>
        )}
        <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
          {selectedWebhook && selectedWebhook.status === 'FAILED' && (
            <button type="button" className="billing-btn billing-btn-primary" onClick={() => { setConfirmAction({ type: 'replay' }); setConfirmOpen(true); }}>Rejouer</button>
          )}
        </div>
      </DetailPanel>
      <ConfirmationModal
        open={confirmOpen}
        title="Rejouer le webhook"
        message={selectedWebhook ? `Voulez-vous rejouer le webhook ${selectedWebhook.eventType} ?` : 'Confirmer'}
        onConfirm={confirmFn}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default WebhooksPage;
