import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

function remainingSeconds(expiresAt) {
  const expires = new Date(expiresAt || 0).getTime();
  return Number.isFinite(expires) ? Math.max(0, Math.ceil((expires - Date.now()) / 1000)) : 0;
}

function friendlyError(error) {
  const code = error?.normalized?.code;
  const status = error?.normalized?.statusCode;
  if (code === 'MFA_CHALLENGE_EXPIRED') return 'Cette vérification a expiré. Reconnectez-vous pour en démarrer une nouvelle.';
  if (status === 429 || code === 'AUTH_TEMP_LOCKED' || code === 'RATE_LIMITED') return 'Trop de tentatives. Patientez avant de réessayer.';
  if (status === 401 || code === 'MFA_INVALID_CODE') return 'Le code est invalide ou la vérification n’est plus disponible.';
  return 'La vérification est momentanément indisponible. Réessayez ou reconnectez-vous.';
}

export default function MfaChallenge({ challenge, onVerify, onBack }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(() => remainingSeconds(challenge?.expiresAt));
  const expired = seconds <= 0;
  const timerLabel = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  useEffect(() => {
    setSeconds(remainingSeconds(challenge?.expiresAt));
    const interval = window.setInterval(() => setSeconds(remainingSeconds(challenge?.expiresAt)), 1000);
    return () => window.clearInterval(interval);
  }, [challenge?.expiresAt]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || expired || code.length !== 6) return;
    setSubmitting(true);
    setError('');
    try {
      await onVerify({ code });
    } catch (failure) {
      setError(friendlyError(failure));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-7 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-[var(--color-primary)]">
        <ShieldCheck size={23} aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">Sécurité du compte</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">Vérification en deux étapes</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Saisissez le code à six chiffres de votre application d’authentification.</p>

      <form className="mt-7 space-y-5" onSubmit={submit} aria-busy={submitting}>
        <div>
          <label htmlFor="mfa-code" className="mb-2 block text-sm font-medium text-slate-700">Code de vérification</label>
          <input
            id="mfa-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            disabled={submitting || expired}
            aria-describedby={error ? 'mfa-error' : 'mfa-expiry'}
            className="w-full rounded-[var(--radius-lg)] border border-slate-300 bg-white px-3.5 py-3 text-center font-mono text-xl tracking-[0.35em] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p id="mfa-expiry" className={`mt-2 text-xs ${expired ? 'text-rose-700' : 'text-[var(--color-text-muted)]'}`}>
            {expired ? 'Cette vérification a expiré.' : `Cette vérification expire dans ${timerLabel}.`}
          </p>
        </div>
        {error && <p id="mfa-error" role="alert" className="rounded-[var(--radius-lg)] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={submitting || expired || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60">
          {submitting && <Loader2 size={17} className="animate-spin motion-reduce:animate-none" />}
          Vérifier et continuer
        </button>
      </form>
      <button type="button" onClick={onBack} disabled={submitting} className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60">
        <ArrowLeft size={16} aria-hidden="true" /> Retour à la connexion
      </button>
    </>
  );
}
