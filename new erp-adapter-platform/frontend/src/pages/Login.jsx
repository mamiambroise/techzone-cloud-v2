import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../auth/AuthContext';
import './Login.css';

const errorMessage = (err) => {
  const body = err?.response?.data;
  const msg = body?.message || err?.message;
  if (body?.code === 'INVALID_CREDENTIALS') return 'Identifiants invalides.';
  if (body?.code === 'USER_PENDING') return 'Compte en attente de validation.';
  if (body?.code === 'USER_SUSPENDED') return 'Compte suspendu.';
  if (body?.code === 'USER_LOCKED') return 'Compte verrouillé.';
  if (body?.code === 'PASSWORD_TOO_SHORT' || body?.code === 'PASSWORD_TOO_LONG' || body?.code === 'PASSWORD_REUSED') return body?.code === 'PASSWORD_TOO_SHORT' ? 'Mot de passe trop court (min 10 caractères).' : body?.code === 'PASSWORD_TOO_LONG' ? 'Mot de passe trop long (max 128).' : 'Mot de passe déjà utilisé récemment.';
  return msg || 'Erreur de connexion. Vérifiez votre réseau.';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const MESSAGES = [
  `${getGreeting()} !`,
  'Bienvenue sur votre espace de travail',
  'Votre espace vous attend',
  'Gestion sécurisée de votre environnement',
];

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const timeoutRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setFade(true);
      timeoutRef.current = setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setFade(false);
      }, 400);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
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
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {isDark ? <SunIcon className="login-toggle-icon" /> : <MoonIcon className="login-toggle-icon" />}
            {isDark ? 'Clair' : 'Sombre'}
          </button>
        </div>

        <div className="login-left-content">
          <h1 className="login-left-title">Gouvernance IAM & Sécurité</h1>
          <p className="login-left-subtitle">
            Une plateforme unifiée pour gérer les identités, les accès et les permissions de votre organisation.
          </p>
          <ul className="login-features">
            <li className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Authentification centralisée
            </li>
            <li className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Gestion des utilisateurs & rôles
            </li>
            <li className="login-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Multi-organisation & multi-tenant
            </li>
          </ul>
        </div>

        <div className="login-left-footer">© 2026 Techzone Cloud. Tous droits réservés.</div>

        <div className="login-decorations" aria-hidden="true">
          <div className="login-decor-icon login-decor-icon--shield">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="login-decor-icon login-decor-icon--lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="login-decor-icon login-decor-icon--key">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div className="login-decor-icon login-decor-icon--fingerprint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <path d="M12 6a6 6 0 0 1 6 6" />
              <path d="M12 10a2 2 0 0 1 2 2" />
            </svg>
          </div>
          <div className="login-decor-icon login-decor-icon--identity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="login-decor-icon login-decor-icon--security-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <div className="login-decor-particle" />
          <div className="login-decor-particle login-decor-particle--d2" />
          <div className="login-decor-particle login-decor-particle--d3" />
          <div className="login-decor-particle login-decor-particle--d4" />
          <div className="login-decor-particle login-decor-particle--d5" />

          <div className="login-decor-ring login-decor-ring--1" />
          <div className="login-decor-ring login-decor-ring--2" />
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <h2 className="login-right-title" style={{ opacity: fade ? 0 : 1 }}>
            {MESSAGES[messageIndex]}
          </h2>          <p className="login-right-subtitle">Connectez-vous à votre espace</p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-identifier" className="login-field-label">
                Adresse email ou identifiant
              </label>
              <input
                id="login-identifier"
                type="text"
                className="login-field-input"
                placeholder="vous@entreprise.com ou username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-field-label">
                Mot de passe
              </label>
              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <div className="login-actions">
              <label className="login-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Se souvenir de moi</span>
              </label>
              <a href="#forgot" className="login-forgot">
                Mot de passe oublié ?
              </a>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading && <span className="login-spinner" aria-hidden="true" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
          </form>

          <div className="login-footer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Connexion sécurisée — Chiffrement de bout en bout
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
