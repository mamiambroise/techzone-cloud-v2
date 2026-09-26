import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitationByToken, acceptInvitation } from '../../api/invitations';


function InvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getInvitationByToken(token);
        setInvitation(result.data);
        setForm((prev) => ({
          ...prev,
          username: result.data.email,
        }));
      } catch (err) {
        setError(err.message || 'Invitation introuvable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      const result = await acceptInvitation(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        password: form.password,
      });
      // Demo only: never create an authentication session.
      navigate('/demo/iam/users');
    } catch (err) {
      setError(err.message || 'Acceptation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="invitation-page">
        <div className="invitation-card">
          <p className="invitation-loading">Chargement de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="invitation-page">
        <div className="invitation-card">
          <h1 className="invitation-title">Invitation invalide</h1>
          <p className="invitation-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-page">
      <div className="invitation-card">
        <h1 className="invitation-title">Accepter l'invitation</h1>
        <p className="invitation-subtitle">Complétez votre profil pour accéder à l'espace</p>

        {invitation && (
          <div className="invitation-context">
            <div className="invitation-context-item">
              <span className="invitation-context-label">Organisation</span>
              <span className="invitation-context-value">{invitation.organizationName}</span>
            </div>
            <div className="invitation-context-item">
              <span className="invitation-context-label">Tenant</span>
              <span className="invitation-context-value">{invitation.tenantName}</span>
            </div>
            <div className="invitation-context-item">
              <span className="invitation-context-label">Email invité</span>
              <span className="invitation-context-value">{invitation.email}</span>
            </div>
            <div className="invitation-context-item">
              <span className="invitation-context-label">Rôle proposé</span>
              <span className="invitation-context-value">{invitation.role}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="invitation-form">
          <div className="invitation-field">
            <label htmlFor="invitation-firstName" className="invitation-field-label">Prénom</label>
            <input
              id="invitation-firstName"
              name="firstName"
              type="text"
              className="invitation-field-input"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="invitation-field">
            <label htmlFor="invitation-lastName" className="invitation-field-label">Nom</label>
            <input
              id="invitation-lastName"
              name="lastName"
              type="text"
              className="invitation-field-input"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="invitation-field">
            <label htmlFor="invitation-username" className="invitation-field-label">Identifiant</label>
            <input
              id="invitation-username"
              name="username"
              type="text"
              className="invitation-field-input"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="invitation-field">
            <label htmlFor="invitation-password" className="invitation-field-label">Mot de passe</label>
            <input
              id="invitation-password"
              name="password"
              type="password"
              className="invitation-field-input"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="invitation-field">
            <label htmlFor="invitation-confirmPassword" className="invitation-field-label">Confirmer le mot de passe</label>
            <input
              id="invitation-confirmPassword"
              name="confirmPassword"
              type="password"
              className="invitation-field-input"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="invitation-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="invitation-submit" disabled={submitting}>
            {submitting ? 'Création du compte...' : 'Accepter et créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default InvitationPage;
