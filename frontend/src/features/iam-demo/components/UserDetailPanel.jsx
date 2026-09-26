import './UserDetailPanel.css';

function UserDetailPanel({ user }) {
  if (!user) {
    return (
      <div className="user-detail-panel">
        <div className="user-detail-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p>Sélectionnez un utilisateur pour afficher les détails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-detail-panel">
      <div className="user-detail-header">
        <div className="user-detail-identity">
          <div className="user-detail-avatar">{user.avatarInitials}</div>
          <div>
            <div className="user-detail-name">{user.firstName} {user.lastName}</div>
            <div className="user-detail-email">{user.email}</div>
          </div>
        </div>
        <span className={`user-detail-status status-${user.status}`}>{user.status === 'active' ? 'Actif' : 'Suspendu'}</span>
      </div>

      <div className="user-detail-pills">
        <span className="user-detail-pill user-detail-pill-role">{user.roles?.[0] || '—'}</span>
        <span className="user-detail-pill user-detail-pill-tenant">{user.tenant || '—'}</span>
      </div>

      <div className="user-detail-tabs">
        {['Aperçu', 'Rôles & Permissions', 'Activité', 'Sécurité'].map((tab) => (
          <button key={tab} className={`user-detail-tab ${tab === 'Aperçu' ? 'user-detail-tab-active' : ''}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="user-detail-fields">
        {[
          { label: 'Identité principale', value: user.email },
          { label: 'Identités liées', value: user.identityType },
          { label: 'Téléphone', value: user.phone || '—' },
          { label: 'Créé le', value: user.createdAt },
          { label: 'Dernière connexion', value: user.lastLogin || '—' },
          { label: 'Langue', value: String(user.language || '—').toUpperCase() },
          { label: 'Fuseau horaire', value: user.timezone || '—' },
          { label: 'Préférences', value: user.preferences || '—' },
        ].map((field) => (
          <div key={field.label} className="user-detail-field">
            <span className="user-detail-field-label">{field.label}</span>
            <span className="user-detail-field-value">{field.value}</span>
          </div>
        ))}
      </div>

      <button className="user-detail-link">Voir le profil complet →</button>
    </div>
  );
}

export default UserDetailPanel;