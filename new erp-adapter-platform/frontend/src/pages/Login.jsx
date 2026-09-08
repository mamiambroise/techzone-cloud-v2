import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserIcon, ArrowRightIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../ThemeContext';

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

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
      <div className="w-full flex justify-end p-4">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LockClosedIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">ERP Adapter Platform</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Connectez-vous pour accéder à votre espace de gestion
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 p-6 sm:p-8 space-y-5"
          >
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Identifiant ou email
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin ou admin@techcloud.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5469D4] focus:border-[#5469D4] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5469D4] dark:text-[#94A3FF] hover:underline"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-24 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5469D4] focus:border-[#5469D4] transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B4BA8] to-[#5469D4] text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-[#35439A] hover:to-[#4A5EC7] focus:outline-none focus:ring-2 focus:ring-[#5469D4] focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                <>
                  Se connecter
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Accès restreint — IAM sécurisé par JWT
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;