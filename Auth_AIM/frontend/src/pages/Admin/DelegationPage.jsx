import { useState, useMemo } from 'react';
import * as delegationService from '../../services/delegationMockService';
import './DelegationPage.css';

function DelegationPage() {
  const [list, setList] = useState(() => delegationService.listDelegations());
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [form, setForm] = useState({
    grantedTo: '',
    scopeType: 'tenant',
    scopeId: 1,
    permissions: '',
    startsAt: '',
    endsAt: '',
    grantedBy: 'Alice Admin',
    delegatorMaxPermission: 'users.write',
  });

  const filtered = useMemo(() => list, [list]);

  const openCreate = () => {
    setForm({
      grantedTo: '',
      scopeType: 'tenant',
      scopeId: 1,
      permissions: '',
      startsAt: '',
      endsAt: '',
      grantedBy: 'Alice Admin',
      delegatorMaxPermission: 'users.write',
    });
    setFormOpen(true);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    try {
      const permissions = form.permissions.split(',').map((p) => p.trim()).filter(Boolean);
      const created = delegationService.createDelegation({
        ...form,
        permissions,
        scopeId: Number(form.scopeId),
      });
      setList(delegationService.listDelegations());
      setFormOpen(false);
      setSelected(created);
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmRevoke = () => {
    if (!revokeTarget) return;
    delegationService.revokeDelegation(revokeTarget.id);
    setList(delegationService.listDelegations());
    setRevokeTarget(null);
  };

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <span>Platform Administration</span>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">Délégation</span>
      </nav>

      <div className="admin-header">
        <div>
          <div className="admin-title-row">
            <h1 className="admin-title">Délégation</h1>
            <button className="admin-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="admin-subtitle">Gestion des délégations de permissions.</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <button type="button" className="admin-primary-btn" onClick={openCreate}>+ Nouvelle délégation</button>
      </div>

      <div className="admin-main">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bénéficiaire</th>
                <th>Scope</th>
                <th>Permissions</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-empty">Aucune délégation.</td>
                </tr>
              )}
              {filtered.map((item) => (
                <tr key={item.id} className={`admin-table-row ${selected?.id === item.id ? 'admin-table-row-selected' : ''}`} onClick={() => setSelected(item)}>
                  <td className="admin-table-cell-primary">{item.delegationId}</td>
                  <td>{item.grantedTo}</td>
                  <td>{item.scopeType}</td>
                  <td>{item.permissions.join(', ')}</td>
                  <td>{item.startsAt}</td>
                  <td>{item.endsAt}</td>
                  <td>
                    <span className={`admin-status-pill admin-status-${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                  <td>
                    <div className="admin-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="admin-revoke-btn"
                        disabled={item.status === 'REVOKED'}
                        onClick={() => setRevokeTarget(item)}
                      >
                        Révoquer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-side">
          {selected ? (
            <div className="admin-detail-panel">
              <div className="admin-detail-header">
                <div>
                  <div className="admin-detail-name">{selected.delegationId}</div>
                  <div className="admin-detail-sub">{selected.grantedTo}</div>
                </div>
                <span className={`admin-status-pill admin-status-${selected.status.toLowerCase()}`}>{selected.status}</span>
              </div>
              <div className="admin-detail-fields">
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Scope</span>
                  <span className="admin-detail-field-value">{selected.scopeType} ({selected.scopeId})</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Permissions</span>
                  <span className="admin-detail-field-value">{selected.permissions.join(', ')}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Début</span>
                  <span className="admin-detail-field-value">{selected.startsAt}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Fin</span>
                  <span className="admin-detail-field-value">{selected.endsAt}</span>
                </div>
                <div className="admin-detail-field">
                  <span className="admin-detail-field-label">Par</span>
                  <span className="admin-detail-field-value">{selected.grantedBy}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-detail-panel admin-detail-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p>Sélectionnez une délégation pour afficher les détails</p>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="admin-modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Nouvelle délégation</h2>
              <button type="button" className="admin-modal-close" onClick={() => setFormOpen(false)} aria-label="Fermer">×</button>
            </div>
            <form className="admin-modal-form" onSubmit={submitCreate}>
              <div className="admin-modal-row">
                <label className="admin-modal-field">
                  <span>Bénéficiaire *</span>
                  <input type="text" value={form.grantedTo} onChange={(e) => setForm({ ...form, grantedTo: e.target.value })} />
                </label>
                <label className="admin-modal-field">
                  <span>Scope *</span>
                  <select value={form.scopeType} onChange={(e) => setForm({ ...form, scopeType: e.target.value })}>
                    <option value="tenant">Tenant</option>
                    <option value="application">Application</option>
                    <option value="environnement">Environnement</option>
                    <option value="support">Support</option>
                    <option value="facturation">Facturation</option>
                    <option value="sécurité">Sécurité</option>
                  </select>
                </label>
              </div>
              <label className="admin-modal-field">
                <span>Permissions (séparées par virgule) *</span>
                <input type="text" value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} />
              </label>
              <div className="admin-modal-row">
                <label className="admin-modal-field">
                  <span>Début</span>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                </label>
                <label className="admin-modal-field">
                  <span>Fin</span>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
                </label>
              </div>
              <label className="admin-modal-field">
                <span>Niveau max du délégant</span>
                <select value={form.delegatorMaxPermission} onChange={(e) => setForm({ ...form, delegatorMaxPermission: e.target.value })}>
                  <option value="users.read">users.read</option>
                  <option value="users.write">users.write</option>
                  <option value="users.admin">users.admin</option>
                </select>
              </label>
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn-secondary" onClick={() => setFormOpen(false)}>Annuler</button>
                <button type="submit" className="admin-primary-btn">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="admin-modal-backdrop" onClick={() => setRevokeTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Révoquer la délégation</h2>
              <button type="button" className="admin-modal-close" onClick={() => setRevokeTarget(null)} aria-label="Fermer">×</button>
            </div>
            <div className="admin-modal-body">
              <p>Voulez-vous révoquer la délégation <strong>{revokeTarget.delegationId}</strong> ?</p>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-modal-btn-secondary" onClick={() => setRevokeTarget(null)}>Annuler</button>
              <button type="button" className="admin-modal-btn-danger" onClick={confirmRevoke}>Révoquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DelegationPage;
