import { useState, useRef } from 'react';
import * as adminActionsService from '../../services/adminActionsMockService';
import SectionIcon from '../../components/SectionIcon';
import './AdminActionsPage.css';

function AdminActionsPage() {
  const [actions] = useState(() => adminActionsService.listActions());
  const [history, setHistory] = useState(() => adminActionsService.listHistory());
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const reasonRef = useRef(null);

  const execute = (action) => {
    setSelectedAction(action);
    setReason('');
    setResult(null);
  };

  const confirmExecute = () => {
    if (!selectedAction) return;
    try {
      adminActionsService.executeAction(selectedAction.id, reason);
      setHistory(adminActionsService.listHistory());
      setResult({ success: true, message: 'Action exécutée avec succès.' });
      setSelectedAction(null);
      setReason('');
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Actions Administratives</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Actions Administratives</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Actions sensibles et pipeline d'exécution.</p>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="alert" /></span>
            Actions disponibles
          </h3>
          <div className="admin-actions-grid">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`admin-action-card ${action.critical ? 'admin-action-card-critical' : ''}`}
                onClick={() => execute(action)}
              >
                <div className="admin-action-card-label">{action.label}</div>
                {action.critical && <span className="admin-critical-badge">Critique</span>}
                <div className="admin-action-pipeline">{action.pipeline.join(' → ')}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="clock" /></span>
            Historique des actions
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Acteur</th>
                  <th>Résultat</th>
                  <th>Horodatage</th>
                  <th>Raison</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{item.action}</td>
                    <td>{item.actor}</td>
                    <td>
                      <span className={`admin-status-pill ${item.result === 'SUCCESS' ? 'admin-status-operational' : 'admin-status-outage'}`}>{item.result}</span>
                    </td>
                    <td>{item.timestamp}</td>
                    <td>{item.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedAction && (
        <div className="admin-modal-backdrop" onClick={() => { setSelectedAction(null); setResult(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Exécuter : {selectedAction.label}</h2>
              <button type="button" className="admin-modal-close" onClick={() => { setSelectedAction(null); setResult(null); }} aria-label="Fermer">×</button>
            </div>
            <div className="admin-modal-body">
              <p>Pipeline : {selectedAction.pipeline.join(' → ')}</p>
              {selectedAction.critical && (
                <>
                  <p className="admin-modal-sub">Cette action est critique.</p>
                  <input
                    ref={reasonRef}
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="admin-reason-input"
                    placeholder="Raison obligatoire..."
                  />
                </>
              )}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-btn-secondary" onClick={() => { setSelectedAction(null); setResult(null); }}>Annuler</button>
              <button type="button" className="admin-modal-btn-danger" onClick={confirmExecute}>Exécuter</button>
            </div>
            {result && (
              <div className={`admin-result ${result.success ? 'admin-result-success' : 'admin-result-error'}`}>
                {result.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminActionsPage;
