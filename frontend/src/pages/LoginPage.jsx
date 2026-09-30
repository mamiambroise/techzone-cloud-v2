import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { ROUTES } from '../app/routes.js';
import { Navigate, useLocation } from 'react-router-dom';
import { Layers, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

// Design system Techzone Cloud : canvas slate très clair, surfaces blanches,
// accent bleu Techzone, radius 10-14px, focus ring visible, micro-interactions 150-200ms.
export default function LoginPage() {
  const location = useLocation();
  const from = location.state?.from;
  const destination = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//') && from.pathname !== ROUTES.login ? { pathname: from.pathname, search: from.search, hash: from.hash } : ROUTES.dashboard;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if (result?.mfaRequired) setError('Ce compte exige une vérification MFA. Utilisez le parcours MFA existant ; cette console ne le prend pas encore en charge.');
    } catch (err) {
      if (err?.normalized?.code === 'INVALID_CREDENTIALS') {
        setError('Identifiants invalides.');
      } else if (err?.normalized?.code === 'USER_PENDING') {
        setError('Compte en attente de validation.');
      } else if (err?.normalized?.code === 'USER_LOCKED') {
        setError('Compte verrouillé.');
      } else if (err?.normalized?.code === 'USER_SUSPENDED') {
        setError('Compte suspendu.');
      } else {
        setError(err?.normalized?.message || err.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return <Navigate to={destination} replace />;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Identité */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-blue-600/20">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Techzone Cloud</h1>
          <p className="text-slate-500 text-sm mt-1">Plateforme SaaS intégrée — connexion à votre espace</p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                Identifiant ou email
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors duration-150"
                placeholder="nom@entreprise.com"
                required
                autoComplete="username"
                autoFocus
                aria-invalid={Boolean(error)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors duration-150 flex items-center gap-1"
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors duration-150"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
              />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Session sécurisée par cookies HttpOnly · IAM Techzone Cloud
        </p>
      </div>
    </div>
  );
}
