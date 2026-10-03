import { useCallback, useEffect, useState } from 'react';

/**
 * Briques communes des ecrans Billing (CDC 15 V2).
 *
 * Regle de rendu : aucune valeur inventee. Un ecran affiche ce que l'API a
 * reellement renvoye ; en cas d'erreur il affiche le CODE et le traceId du
 * contrat d'erreur global, jamais un message silencieux ni un jeu de données
 * fictif.
 */

export function useBillingResource(loader, deps = [], { auto = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(auto);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result?.data ?? result ?? null);
      return result;
    } catch (raised) {
      const normalized = raised?.normalized ?? {
        code: raised?.code ?? null,
        message: raised?.message ?? 'Erreur inconnue',
        traceId: raised?.traceId ?? null,
        statusCode: raised?.response?.status ?? null,
      };
      setError(normalized);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (auto) void run();
  }, [run, auto]);

  return { data, error, loading, reload: run, setData };
}

/** Montant affiche tel que l'API l'a calcule : aucune reconversion locale. */
export function amount(value, currency) {
  if (value === null || value === undefined || value === '') return '—';
  const text = String(value);
  return currency ? `${text} ${currency}` : text;
}

export function dateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('fr-FR');
}

export function dateOnly(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('fr-FR');
}

const STATUS_TONES = {
  ACTIVE: 'emerald',
  TRIALING: 'sky',
  DRAFT: 'slate',
  PAST_DUE: 'amber',
  GRACE_PERIOD: 'amber',
  SUSPENDED: 'rose',
  CANCELLED: 'slate',
  EXPIRED: 'slate',
  ENDED: 'slate',
  OPEN: 'sky',
  PARTIALLY_PAID: 'amber',
  PAID: 'emerald',
  OVERDUE: 'rose',
  VOID: 'slate',
  PENDING: 'amber',
  PROCESSING: 'sky',
  SUCCEEDED: 'emerald',
  FAILED: 'rose',
  REFUNDED: 'slate',
  PARTIALLY_REFUNDED: 'amber',
  RESTRICTED: 'amber',
  UNAVAILABLE: 'slate',
  HEALTHY: 'emerald',
  WARNING: 'amber',
  DEGRADED: 'amber',
  CRITICAL: 'rose',
  UNKNOWN: 'slate',
};

const TONE_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatusBadge({ value, fallback = '—' }) {
  if (!value) return <span className="text-xs text-slate-400">{fallback}</span>;
  const tone = STATUS_TONES[String(value)] ?? 'slate';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}>
      {String(value)}
    </span>
  );
}

export function BillingError({ error, title = 'Action impossible' }) {
  if (!error) return null;
  const status = error.statusCode;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <p className="font-medium">{title}</p>
      {error.code ? <p className="mt-1 font-mono text-xs">{String(error.code)}</p> : null}
      <p className="mt-1">{error.message}</p>
      {status ? <p className="mt-1 text-xs opacity-80">HTTP {status}</p> : null}
      {error.traceId ? <p className="mt-1 font-mono text-[11px] opacity-70">traceId {error.traceId}</p> : null}
    </div>
  );
}

export function BillingLoading({ label = 'Chargement…' }) {
  return <p className="py-6 text-center text-sm text-slate-500">{label}</p>;
}

export function BillingEmpty({ label = 'Aucune donnée.', hint = null }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
      <p className="text-sm text-slate-600">{label}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function BillingPanel({ title, description, actions, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function DataRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-900">{children ?? '—'}</span>
    </div>
  );
}

export function ActionButton({ children, onClick, disabled, tone = 'slate', type = 'button', title }) {
  const tones = {
    slate: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800',
    danger: 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50',
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] ?? tones.slate}`}
    >
      {children}
    </button>
  );
}
