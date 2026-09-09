import { useState, useMemo, useRef } from 'react';
import { sessions as initialSessions, sessionStatusConfig, sessionsStats } from '../../data/mock';
import './SessionsPage.css';

function getDeviceIcon(device) {
  const lower = String(device || '').toLowerCase();
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('android')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function StatIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'session') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (name === 'device') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (name === 'alert') {
    return (
      <svg {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  if (name === 'expired') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return null;
}

function ActionMenu({ session, onRevoke, onView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useMemo(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="sessions-action-menu" ref={ref}>
      <button
        type="button"
        className="sessions-action-btn"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>
      {open && (
        <div className="sessions-action-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onView(session); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Voir détails
          </button>
          {!session.isCurrent && session.status !== 'REVOKED' && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); onRevoke(session); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
              </svg>
              Révoquer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SessionsPage() {
  const [sessions, setSessions] = useState(() => initialSessions);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const revocableSessions = useMemo(
    () => sessions.filter((s) => !s.isCurrent && s.status !== 'REVOKED'),
    [sessions]
  );

  const handleRevoke = (session) => {
    setRevokeTarget(session);
  };

  const confirmRevoke = () => {
    if (!revokeTarget) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === revokeTarget.id ? { ...s, status: 'REVOKED' } : s
      )
    );
    setRevokeTarget(null);
  };

  const confirmRevokeAll = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.isCurrent ? s : { ...s, status: 'REVOKED' }
      )
    );
    setRevokeAllOpen(false);
  };

  const handleView = (session) => {
    alert(`Détails de la session :\nUtilisateur : Utilisateur #${session.userId}\nAppareil : ${session.device}\nIP : ${session.ip}\nLocalisation : ${session.location}\nDernière activité : ${session.lastActiveAt}\nStatut : ${sessionStatusConfig[session.status]?.label || session.status}`);
  };

  return (
    <div className="sessions-page">
      <nav className="sessions-breadcrumb">
        <span>Auth + IAM + Context</span>
        <span className="sessions-breadcrumb-sep">/</span>
        <span className="sessions-breadcrumb-current">Sessions & Sécurité</span>
      </nav>

      <div className="sessions-header">
        <div>
          <div className="sessions-title-row">
            <h1 className="sessions-title">Sessions & Sécurité</h1>
            <button className="sessions-info-btn" title="Information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </div>
          <p className="sessions-subtitle">Surveillez les sessions actives et révoquez les accès si nécessaire.</p>
        </div>
      </div>

      <div className="sessions-stats">
        {sessionsStats.map((stat) => (
          <div key={stat.label} className="sessions-stat-card">
            <div className="sessions-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <StatIcon name={stat.icon} />
            </div>
            <div className="sessions-stat-content">
              <span className="sessions-stat-value">{stat.value}</span>
              <span className="sessions-stat-label">{stat.label}</span>
              <span className="sessions-stat-context">{stat.context}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sessions-toolbar">
        <button
          type="button"
          className="sessions-danger-btn"
          disabled={revocableSessions.length === 0}
          onClick={() => setRevokeAllOpen(true)}
        >
          Révoquer toutes les autres sessions
        </button>
      </div>

      <div className="sessions-table-wrapper">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Appareil</th>
              <th>Localisation</th>
              <th>IP</th>
              <th>Dernière activité</th>
              <th>Session actuelle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={8} className="sessions-empty">Aucune session enregistrée.</td>
              </tr>
            )}
            {sessions.map((session) => {
              const status = sessionStatusConfig[session.status] || sessionStatusConfig.ACTIVE;
              return (
                <tr key={session.id} className={`sessions-table-row ${session.isCurrent ? 'sessions-table-row-current' : ''}`}>
                  <td>
                    <div className="sessions-user-cell">
                      <div className="sessions-user-avatar">{session.userId}</div>
                      <div>
                        <div className="sessions-user-name">Utilisateur #{session.userId}</div>
                        <div className="sessions-user-email">user{session.userId}@boutique.com</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="sessions-device-cell">
                      <span className="sessions-device-icon">{getDeviceIcon(session.device)}</span>
                      <span>{session.device}</span>
                    </div>
                  </td>
                  <td>{session.location}</td>
                  <td><code className="sessions-ip">{session.ip}</code></td>
                  <td>{session.lastActiveAt}</td>
                  <td>
                    {session.isCurrent && (
                      <span className="sessions-current-badge">Session actuelle</span>
                    )}
                  </td>
                  <td>
                    <span className="sessions-status-pill" style={{ backgroundColor: status.bg, color: status.text }}>
                      {status.label}
                    </span>
                  </td>
                  <td>
                    <div className="sessions-actions-cell">
                      <ActionMenu
                        session={session}
                        onRevoke={handleRevoke}
                        onView={handleView}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {revokeTarget && (
        <div className="sessions-modal-backdrop" onClick={() => setRevokeTarget(null)}>
          <div className="sessions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sessions-modal-header">
              <h2 className="sessions-modal-title">Révoquer la session</h2>
              <button type="button" className="sessions-modal-close" onClick={() => setRevokeTarget(null)} aria-label="Fermer">×</button>
            </div>
            <div className="sessions-modal-body">
              <p>Voulez-vous révoquer la session de <strong>Utilisateur #{revokeTarget.userId}</strong> sur <strong>{revokeTarget.device}</strong> ?</p>
              <p className="sessions-modal-sub">Cette action est immédiate et nécessitera une nouvelle authentification.</p>
            </div>
            <div className="sessions-modal-actions">
              <button type="button" className="sessions-modal-btn-secondary" onClick={() => setRevokeTarget(null)}>Annuler</button>
              <button type="button" className="sessions-modal-btn-danger" onClick={confirmRevoke}>Révoquer</button>
            </div>
          </div>
        </div>
      )}

      {revokeAllOpen && (
        <div className="sessions-modal-backdrop" onClick={() => setRevokeAllOpen(false)}>
          <div className="sessions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sessions-modal-header">
              <h2 className="sessions-modal-title">Révoquer toutes les autres sessions</h2>
              <button type="button" className="sessions-modal-close" onClick={() => setRevokeAllOpen(false)} aria-label="Fermer">×</button>
            </div>
            <div className="sessions-modal-body">
              <p>Voulez-vous révoquer <strong>{revocableSessions.length} session(s)</strong> autres que la session actuelle ?</p>
              <p className="sessions-modal-sub">Tous les appareils concernés devront se réauthentifier.</p>
            </div>
            <div className="sessions-modal-actions">
              <button type="button" className="sessions-modal-btn-secondary" onClick={() => setRevokeAllOpen(false)}>Annuler</button>
              <button type="button" className="sessions-modal-btn-danger" onClick={confirmRevokeAll}>Révoquer tout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionsPage;
