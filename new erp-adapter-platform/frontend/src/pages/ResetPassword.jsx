import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { iamAuthService } from '../services/api';
import './Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Lien de réinitialisation invalide. Demandez un nouveau lien.');
      return;
    }
    if (password.length < 10) {
      setError('Le mot de passe doit contenir au moins 10 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await iamAuthService.resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      const body = err?.response?.data;
      if (body?.code === 'INVALID_RESET_TOKEN') {
        setError('Lien invalide ou expiré. Demandez un nouveau lien.');
      } else if (body?.code === 'PASSWORD_REUSED') {
        setError('Ce mot de passe a déjà été utilisé récemment.');
      } else {
        setError(body?.message || 'Échec de la réinitialisation. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Techzone Cloud
          </div>
        </div>

        <div className="login-left-content">
          <h1 className="login-left-title">Récupération du mot de passe</h1>
          <p className="login-left-subtitle">
            Définissez un nouveau mot de passe sécurisé pour votre compte. Vous pourrez ensuite vous connecter normalement.
          </p>
          <ul className="login-features">
            <li className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Minimum 10 caractères
            </li>
            <li className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Lien valide 30 minutes
            </li>
          </ul>
        </div>

        <div className="login-left-footer">© 2026 Techzone Cloud. Tous droits réservés.</div>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          {success ? (
            <div className="reset-success">
              <CheckCircleIcon className="reset-success-icon" />
              <h2 className="login-right-title">Mot de passe réinitialisé</h2>
              <p className="login-right-subtitle">Votre nouveau mot de passe est enregistré. Connectez-vous avec.</p>
              <Link to="/login" className="reset-back-link">→ Se connecter</Link>
            </div>
          ) : (
            <>
              <h2 className="login-right-title">Nouveau mot de passe</h2>
              <p className="login-right-subtitle">Choisissez un mot de passe sécurisé (10 caractères minimum).</p>

              {!token && (
                <div className="reset-warning">
                  <ExclamationTriangleIcon className="reset-warning-icon" />
                  Lien de réinitialisation manquant dans l'URL.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="reset-password" className="login-field-label">
                    Nouveau mot de passe
                  </label>
                  <div className="login-password-wrapper">
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-field-input"
                      placeholder="••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="reset-confirm" className="login-field-label">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="reset-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className="login-field-input"
                    placeholder="••••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button type="submit" className={`login-submit${loading ? ' loading' : ''}`} disabled={loading}>
                  {loading ? (
                    <span className="login-loader" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle className="login-loader-track" cx="12" cy="12" r="10" />
                        <circle className="login-loader-bar" cx="12" cy="12" r="10" />
                      </svg>
                    </span>
                  ) : (
                    <span className="login-btn-label">Réinitialiser le mot de passe</span>
                  )}
                </button>
                {error && <div className="login-error" role="alert">{error}</div>}
              </form>

              <div className="login-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <Link to="/login">Retour à la connexion</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;