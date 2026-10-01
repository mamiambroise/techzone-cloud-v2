import { Layers, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck, Boxes, Workflow } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { ROUTES } from '../app/routes.js';
import { Navigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const location = useLocation();
  const from = location.state?.from;
  const destination = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//') && from.pathname !== ROUTES.login ? { pathname: from.pathname, search: from.search, hash: from.hash } : ROUTES.dashboard;
  const pending = useRef(false);
  const [visible,setVisible] = useState(false);
  const [capsLock,setCapsLock] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, sessionExpired } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
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
      pending.current = false;
      setLoading(false);
    }
  };

  if (isAuthenticated) return <Navigate to={destination} replace />;

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      <section className="relative overflow-hidden bg-blue-950 px-6 py-8 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-16 lg:py-12" aria-label="Techzone Cloud">
        <div className="flex items-center gap-3 font-semibold tracking-tight"><span className="rounded-xl bg-blue-600 p-2.5"><Layers size={24}/></span>Techzone Cloud</div>
        <div className="relative z-10 my-10 hidden max-w-lg lg:block"><p className="mb-4 text-sm font-medium text-blue-300">Votre plateforme métier</p><h1 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">Construisez.<br/>Publiez.<br/>Faites fonctionner votre activité.</h1><p className="mt-6 text-base leading-relaxed text-blue-100/80">Applications, packs et exécution réunis dans un espace de travail cohérent.</p><div className="mt-10 flex flex-wrap gap-3 text-xs text-blue-100">{[[Boxes,'Applications métier'],[Workflow,'Packs & Runtime'],[ShieldCheck,'Accès sécurisé']].map(([Icon,label]) => <span key={label} className="flex items-center gap-2 rounded-lg border border-blue-800 px-3 py-2"><Icon size={15}/>{label}</span>)}</div></div>
        <p className="hidden text-xs text-blue-200/70 lg:block">Techzone Cloud · Espace de travail</p>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rotate-12 rounded-[48px] border border-blue-400/10"/>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Bienvenue</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Connexion à votre espace</h2><p className="mt-2 mb-8 text-sm text-slate-500">Utilisez votre compte Techzone Cloud.</p>
          {(sessionExpired || location.state?.sessionExpired) && <p role="status" className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Votre session a expiré. Connectez-vous pour reprendre.</p>}
          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
            <div><label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-700">Identifiant ou email</label><input id="identifier" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="nom@entreprise.com" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 motion-reduce:transition-none" aria-describedby={error ? 'login-error' : undefined}/></div>
            <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label><div className="relative"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))} onKeyDown={e => setCapsLock(e.getModifierState('CapsLock'))} onBlur={() => setCapsLock(false)} className="w-full rounded-lg border border-slate-300 py-3 pl-3.5 pr-12 text-sm outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 motion-reduce:transition-none" aria-describedby={error ? 'login-error' : undefined}/><button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} onClick={() => setVisible(v => !v)} className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600">{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{capsLock && <p role="status" className="mt-2 text-xs text-amber-700">Verr. Maj est activé.</p>}</div>
            {error && <p id="login-error" role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">{loading ? <Loader2 size={17} className="animate-spin motion-reduce:animate-none"/> : <ArrowRight size={17}/>} {loading ? 'Connexion…' : 'Se connecter'}</button>
          </form>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14}/>Accès à votre organisation</p>
        </div>
      </section>
    </main>
  );
}
