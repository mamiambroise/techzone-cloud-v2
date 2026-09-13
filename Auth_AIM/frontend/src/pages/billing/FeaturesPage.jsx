import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { ConfirmationModal } from '../../components/observability/ConfirmationModal';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as featuresService from '../../services/billingFeaturesMockService';
import './BillingPage.css';

function FeaturesPage() {
  const { toast, showToast } = useToast();
  const [features, setFeatures] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formFeature, setFormFeature] = useState(null);

  useEffect(() => {
    setFeatures(featuresService.listFeatures());
    setOverrides(featuresService.listOverrides());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedFeature(row);
    setFormFeature(null);
    setDetailOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setSelectedFeature(null);
    setFormFeature({ code: '', name: '', status: 'ACTIVE', measured: false, quotaCode: null });
    setDetailOpen(true);
  }, []);

  const confirmFn = useCallback(() => {
    if (!confirmAction) return;
    if (confirmAction.type === 'create' && formFeature) {
      const created = featuresService.createFeature(formFeature);
      if (created) {
        setFeatures(featuresService.listFeatures());
        setDetailOpen(false);
        setFormFeature(null);
        setSelectedFeature(null);
        showToast('Feature créée avec succès');
      }
    } else if (confirmAction.type === 'edit' && selectedFeature && formFeature) {
      const updated = featuresService.updateFeature(selectedFeature.code, formFeature);
      if (updated) {
        setFeatures(featuresService.listFeatures());
        setSelectedFeature(updated);
        setFormFeature(null);
        showToast('Feature modifiée avec succès');
      }
    } else if (confirmAction.type === 'override') {
      const ov = { featureCode: selectedFeature?.code, tenantName: 'Boutique B - Munich', granted: true, reason: 'Override test', author: 'Alice Admin' };
      featuresService.addOverride(ov);
      setOverrides(featuresService.listOverrides());
      showToast('Override ajouté avec succès');
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  }, [confirmAction, selectedFeature, formFeature, overrides, showToast]);

  const columns = useMemo(() => [
    { key: 'code', label: 'Code', width: '12rem' },
    { key: 'name', label: 'Nom', width: '12rem' },
    { key: 'status', label: 'Statut', width: '10rem', render: (v) => <StatusBadge status={v} /> },
    { key: 'measured', label: 'Mesurée', width: '8rem', render: (v) => v ? 'Oui' : 'Non' },
    { key: 'quotaCode', label: 'Quota associé', width: '12rem' },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Gestion des Features</span>
      </nav>
      <h1 className="billing-title">Gestion des Features</h1>
      <p className="billing-subtitle">Features, plans associés et overrides par tenant.</p>
      <div className="billing-toolbar">
        <div className="billing-toolbar-left" />
        <div className="billing-toolbar-right">
          <button type="button" className="billing-btn billing-btn-primary" onClick={handleCreate}>Créer une feature</button>
        </div>
      </div>
      <div className="billing-table-wrapper">
        <DataTable columns={columns} rows={features} rowKey="code" onRowClick={handleRowClick} emptyMessage="Aucune feature trouvée" />
      </div>
      <DetailPanel open={detailOpen} title={selectedFeature ? `Feature : ${selectedFeature?.code || ''}` : formFeature ? 'Créer une feature' : 'Détail'} onClose={() => setDetailOpen(false)}>
        {(selectedFeature || formFeature) && (
          <>
            {(selectedFeature || formFeature) && (
              <div className="billing-detail-grid">
                <div className="billing-detail-field"><span className="billing-detail-label">Code</span><span className="billing-detail-value">{(selectedFeature || formFeature).code}</span></div>
                <div className="billing-detail-field"><span className="billing-detail-label">Nom</span><span className="billing-detail-value">{(selectedFeature || formFeature).name}</span></div>
                <div className="billing-detail-field"><span className="billing-detail-label">Statut</span><span className="billing-detail-value"><StatusBadge status={(selectedFeature || formFeature).status} /></span></div>
                <div className="billing-detail-field"><span className="billing-detail-label">Mesurée</span><span className="billing-detail-value">{(selectedFeature || formFeature).measured ? 'Oui' : 'Non'}</span></div>
                <div className="billing-detail-field"><span className="billing-detail-label">Quota</span><span className="billing-detail-value">{(selectedFeature || formFeature).quotaCode || '—'}</span></div>
              </div>
            )}
            <div className="billing-section" style={{ marginTop: '1rem' }}>
              <h3 className="billing-section-title">Plans qui incluent cette feature</h3>
              <div className="billing-table-wrapper">
                <table className="billing-table">
                  <thead><tr><th>Plan</th></tr></thead>
                  <tbody>
                    {((selectedFeature || formFeature)?.plans || []).map((p) => (
                      <tr key={p}><td>{p}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
             <div className="billing-section" style={{ marginTop: '1rem' }}>
               <h3 className="billing-section-title">Plans associés (éditable)</h3>
               {(selectedFeature || formFeature) && ((selectedFeature || formFeature).plans || []).map((p) => (
                 <div key={p} className="billing-override-item">{p}</div>
               ))}
             </div>
             {formFeature && (
               <div className="billing-modal" style={{ marginTop: '0.5rem' }}>
                 <div className="billing-detail-field"><span className="billing-detail-label">Code</span><input className="billing-input" value={formFeature.code || ''} onChange={(e) => setFormFeature({ ...formFeature, code: e.target.value })} disabled={!!selectedFeature} /></div>
                 <div className="billing-detail-field"><span className="billing-detail-label">Nom</span><input className="billing-input" value={formFeature.name || ''} onChange={(e) => setFormFeature({ ...formFeature, name: e.target.value })} /></div>
               </div>
             )}
             <div className="obs-detail-actions" style={{ marginTop: '1rem' }}>
              {formFeature && (
                <>
                  <button type="button" className="billing-btn" onClick={() => {
                    setFormFeature(null);
                    setSelectedFeature(null);
                    setDetailOpen(false);
                  }}>Annuler</button>
                  <button
                    type="button"
                    className="billing-btn billing-btn-primary"
                    onClick={() => {
                      if (selectedFeature) {
                        if (!formFeature.name || !formFeature.name.trim()) return;
                        setConfirmAction({ type: 'edit' });
                      } else {
                        if (!formFeature.code || !formFeature.code.trim()) {
                          showToast('Le code est obligatoire.');
                          return;
                        }
                        if (!formFeature.name || !formFeature.name.trim()) {
                          showToast('Le nom est obligatoire.');
                          return;
                        }
                        setConfirmAction({ type: 'create' });
                      }
                      setConfirmOpen(true);
                    }}
                    disabled={
                      selectedFeature
                        ? (!formFeature.name || !formFeature.name.trim())
                        : (!formFeature.code || !formFeature.code.trim() || !formFeature.name || !formFeature.name.trim())
                    }
                  >Enregistrer</button>
                </>
              )}
              {!formFeature && selectedFeature && (
                <>
                  <button type="button" className="billing-btn billing-btn-primary" onClick={() => { setFormFeature({ ...selectedFeature }); }}>Modifier</button>
                  <button type="button" className="billing-btn" onClick={() => { setConfirmAction({ type: 'override' }); setConfirmOpen(true); }}>Ajouter override</button>
                </>
              )}
            </div>
          </>
        )}
      </DetailPanel>
      <div className="billing-section" style={{ marginTop: '2rem' }}>
        <h3 className="billing-section-title">Overrides tenant</h3>
        <div className="billing-table-wrapper">
          <table className="billing-table">
            <thead><tr><th>Feature</th><th>Tenant</th><th>Accordé</th><th>Date</th><th>Raison</th><th>Auteur</th></tr></thead>
            <tbody>
              {overrides.map((o, i) => (
                <tr key={i}>
                  <td>{o.featureCode}</td>
                  <td>{o.tenantName}</td>
                  <td><span className={o.granted ? 'billing-badge-active' : 'billing-badge-danger'}>{o.granted ? 'Oui' : 'Non'}</span></td>
                  <td>{o.date}</td>
                  <td>{o.reason}</td>
                  <td>{o.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        open={confirmOpen}
        title={confirmAction?.type === 'override' ? 'Ajouter un override' : 'Sauvegarder'}
        message={confirmAction?.type === 'override' && selectedFeature
          ? `Ajouter un override pour ${selectedFeature.code} ?`
          : 'Voulez-vous sauvegarder cette feature ?'}
        onConfirm={confirmFn}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default FeaturesPage;
