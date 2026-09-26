import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as plansService from '../../services/billingPlansMockService';
import './BillingPage.css';

const LIFECYCLE = ['DRAFT', 'VALIDATING', 'ACTIVE', 'DEPRECATED', 'ARCHIVED'];

function PlansPage() {
  const { toast, showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionMode, setActionMode] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formPlan, setFormPlan] = useState(null);

  useEffect(() => {
    setPlans(plansService.listPlans());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedPlan(row);
    setDetailOpen(true);
    setActionMode(null);
    setFormPlan(null);
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedPlan(null);
    setFormPlan({ code: '', name: '', description: '', status: 'DRAFT', billingPeriod: 'MONTHLY', currency: 'EUR', basePrice: 0, trialDays: 0 });
    setActionMode('create');
    setDetailOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedPlan) return;
    setFormPlan({ ...selectedPlan });
    setActionMode('edit');
  }, [selectedPlan]);

  const confirmActionFn = useCallback(() => {
    if (!confirmAction) return;
    if (confirmAction.type === 'changeStatus') {
      if (!selectedPlan) return;
      const updated = plansService.changePlanStatus(selectedPlan.id, confirmAction.status);
      if (updated) {
        setPlans(plansService.listPlans());
        setSelectedPlan(updated);
        showToast('Statut modifié avec succès');
      }
    } else if (confirmAction.type === 'save') {
      if (actionMode === 'create') {
        const created = plansService.createPlan(formPlan || {});
        if (created) {
          setPlans(plansService.listPlans());
          setDetailOpen(false);
          setFormPlan(null);
          showToast('Plan créé avec succès');
        }
      } else if (actionMode === 'edit' && selectedPlan) {
        const updated = plansService.updatePlan(selectedPlan.id, formPlan || {});
        if (updated) {
          setPlans(plansService.listPlans());
          setSelectedPlan(updated);
          setFormPlan(null);
          showToast('Plan modifié avec succès');
        }
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
    setActionMode(null);
  }, [confirmAction, selectedPlan, formPlan, actionMode, showToast]);

  const columns = useMemo(() => [
    { key: 'code', label: 'Code', width: '8rem' },
    { key: 'name', label: 'Nom', width: '10rem' },
    { key: 'status', label: 'Statut', width: '10rem', render: (v) => <StatusBadge status={v} /> },
    { key: 'billingPeriod', label: 'Periodicité', width: '10rem' },
    { key: 'basePrice', label: 'Prix', width: '8rem', render: (v) => `${v} €` },
    { key: 'version', label: 'Version', width: '6rem' },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Plans &amp; Offres</span>
      </nav>
      <h1 className="billing-title">Plans &amp; Offres</h1>
      <p className="billing-subtitle">Gestion des plans de facturation et de leurs versions.</p>
      <div className="billing-toolbar">
        <div className="billing-toolbar-left" />
        <div className="billing-toolbar-right">
          <button type="button" className="billing-btn billing-btn-primary" onClick={handleCreate}>Créer un plan</button>
        </div>
      </div>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={plans} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucun plan trouvé" />
      </div>
      <DetailPanel open={detailOpen} title={actionMode === 'create' ? 'Créer un plan' : selectedPlan ? `Plan : ${selectedPlan?.code || ''}` : 'Détail du plan'} onClose={() => { setDetailOpen(false); setActionMode(null); setFormPlan(null); }}>
        {selectedPlan && actionMode !== 'create' && (
          <div className="billing-detail-grid">
            <div className="billing-detail-field"><span className="billing-detail-label">Code</span><span className="billing-detail-value">{selectedPlan.code}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Nom</span><span className="billing-detail-value">{selectedPlan.name}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={selectedPlan.status} /></span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Periodicité</span><span className="billing-detail-value">{selectedPlan.billingPeriod}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Prix</span><span className="billing-detail-value">{selectedPlan.basePrice} €</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Version</span><span className="billing-detail-value">{selectedPlan.version}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Description</span><span className="billing-detail-value">{selectedPlan.description || '—'}</span></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Trial (jours)</span><span className="billing-detail-value">{selectedPlan.trialDays}</span></div>
          </div>
        )}
        {actionMode === 'create' && formPlan && (
          <div className="billing-modal">
            <div className="billing-detail-field"><span className="billing-detail-label">Code</span><input className="billing-input" value={formPlan.code} onChange={(e) => setFormPlan({ ...formPlan, code: e.target.value })} /></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Nom</span><input className="billing-input" value={formPlan.name} onChange={(e) => setFormPlan({ ...formPlan, name: e.target.value })} /></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Prix</span><input className="billing-input" type="number" value={formPlan.basePrice} onChange={(e) => setFormPlan({ ...formPlan, basePrice: Number(e.target.value) })} /></div>
          </div>
        )}
        {actionMode === 'edit' && formPlan && (
          <div className="billing-modal">
            <div className="billing-detail-field"><span className="billing-detail-label">Nom</span><input className="billing-input" value={formPlan.name} onChange={(e) => setFormPlan({ ...formPlan, name: e.target.value })} /></div>
            <div className="billing-detail-field"><span className="billing-detail-label">Prix</span><input className="billing-input" type="number" value={formPlan.basePrice} onChange={(e) => setFormPlan({ ...formPlan, basePrice: Number(e.target.value) })} /></div>
          </div>
        )}
        <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
          {(actionMode === 'create' || actionMode === 'edit') && formPlan && (
            <>
              <button type="button" className="billing-btn" onClick={() => {
                setDetailOpen(false);
                setActionMode(null);
                setFormPlan(null);
              }}>Annuler</button>
              <button
                type="button"
                className="billing-btn billing-btn-primary"
                onClick={() => {
                  if (actionMode === 'create' && !formPlan.code.trim()) {
                    showToast('Le code est obligatoire.');
                    return;
                  }
                  if ((!formPlan.name || !formPlan.name.trim()) && actionMode === 'create') {
                    showToast('Le nom est obligatoire.');
                    return;
                  }
                  setConfirmAction({ type: 'save' });
                  setConfirmOpen(true);
                }}
                disabled={(actionMode === 'create' && (!formPlan.code.trim() || !formPlan.name.trim())) || (actionMode === 'edit' && !formPlan.name.trim())}
              >Enregistrer</button>
            </>
          )}
          {!actionMode && !selectedPlan?.status && <button type="button" className="billing-btn billing-btn-primary" onClick={handleEdit}>Éditer</button>}
          {!actionMode && selectedPlan?.status && (
            <>
              <button type="button" className="billing-btn billing-btn-primary" onClick={handleEdit}>Éditer</button>
              <button type="button" className="billing-btn" onClick={() => { setConfirmAction({ type: 'changeStatus' }); setConfirmOpen(true); }}>Changer statut</button>
            </>
          )}
        </div>
      </DetailPanel>
      {confirmOpen && (
        <ConfirmationModal
          open={confirmOpen}
          title={confirmAction?.type === 'changeStatus' ? 'Changer le statut' : 'Sauvegarder'}
          message={confirmAction?.type === 'changeStatus' && selectedPlan
            ? `Voulez-vous passer le plan ${selectedPlan.code} au statut ${confirmAction.status} ?`
            : 'Voulez-vous sauvegarder ce plan ?'}
          onConfirm={confirmActionFn}
          onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
          danger={confirmAction?.type === 'changeStatus'}
        />
      )}
      {confirmAction?.type === 'changeStatus' && (
        <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 1000, display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {LIFECYCLE.filter((s) => s !== selectedPlan?.status).map((s) => (
            <button key={s} type="button" className="billing-btn" onClick={() => { setConfirmAction({ type: 'changeStatus', status: s }); setConfirmOpen(true); }}>{s}</button>
          ))}
        </div>
      )}
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default PlansPage;
