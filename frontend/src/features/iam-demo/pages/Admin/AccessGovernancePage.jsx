import { useState, useEffect, useRef } from 'react';
import * as accessGovernanceService from '../../services/accessGovernanceMockService';
import SectionIcon from '../../components/SectionIcon';
import './AccessGovernancePage.css';

function ActionMenu({ review, onApprove, onRevoke }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="admin-action-menu" ref={ref}>
      <button type="button" className="admin-action-btn" title="Actions" onClick={() => setOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && review.status === 'pending' && (
        <div className="admin-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onApprove(review); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Approuver
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onRevoke(review); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
            </svg>
            Révoquer
          </button>
        </div>
      )}
    </div>
  );
}

function AccessGovernancePage() {
  const [roles] = useState(() => accessGovernanceService.listRoles());
  const [reviews, setReviews] = useState(() => accessGovernanceService.listReviews());
  const [actionTarget, setActionTarget] = useState(null);
  const [reason, setReason] = useState('');
  const reviewRef = useRef(null);

  const handleApprove = (review) => {
    accessGovernanceService.approveReview(review.id);
    setReviews(accessGovernanceService.listReviews());
  };

  const handleRevoke = (review) => {
    setActionTarget(review);
    setReason('');
  };

  const confirmRevoke = () => {
    if (!actionTarget) return;
    try {
      accessGovernanceService.revokeReview(actionTarget.id, reason);
      setReviews(accessGovernanceService.listReviews());
    } catch (err) {
      alert(err.message);
    } finally {
      setActionTarget(null);
      setReason('');
    }
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Gouvernance des Accès</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Gouvernance des Accès</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Revue des rôles, permissions et affectations critiques.</p>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="trophy" /></span>
            Rôles critiques
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rôle</th>
                  <th>Scope</th>
                  <th>Niveau de risque</th>
                  <th>Privilège excessif</th>
                  <th>Assignés</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{role.name}</td>
                    <td>{role.scope}</td>
                    <td>
                      <span className={`admin-risk-pill admin-risk-${role.riskLevel.toLowerCase()}`}>{role.riskLevel}</span>
                    </td>
                    <td>{role.excessivePrivilege ? 'Oui' : 'Non'}</td>
                    <td>{role.assignees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">
            <span className="admin-section-title-icon"><SectionIcon name="clock" /></span>
            Revue d'accès
          </h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sujet</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Demandé le</th>
                  <th>Raison</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="admin-table-row">
                    <td className="admin-table-cell-primary">{review.subject}</td>
                    <td>{review.role}</td>
                    <td>
                      <span className={`admin-status-pill admin-status-${review.status === 'pending' ? 'outage' : review.status === 'approved' ? 'operational' : 'degraded'}`}>{review.status}</span>
                    </td>
                    <td>{review.requestedAt}</td>
                    <td>{review.reason}</td>
                    <td>
                      <div className="admin-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu review={review} onApprove={handleApprove} onRevoke={handleRevoke} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {actionTarget && (
        <div className="admin-modal-backdrop" onClick={() => { setActionTarget(null); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Révoquer l'accès</h2>
              <button type="button" className="admin-modal-close" onClick={() => { setActionTarget(null); }} aria-label="Fermer">×</button>
            </div>
            <div className="admin-modal-body">
              <p>Raison de la révocation (obligatoire) :</p>
              <input
                ref={reviewRef}
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="admin-reason-input"
                placeholder="Saisir une raison..."
              />
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-btn-secondary" onClick={() => { setActionTarget(null); }}>Annuler</button>
              <button type="button" className="admin-modal-btn-danger" onClick={confirmRevoke}>Révoquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessGovernancePage;
