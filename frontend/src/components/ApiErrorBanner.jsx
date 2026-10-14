import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SUPPRESSED_CODES = new Set(['TENANT_REQUIRED']);

export default function ApiErrorBanner() {
  const [errors, setErrors] = useState([]);
  const { pathname } = useLocation();
  useEffect(() => setErrors([]), [pathname]);
  useEffect(() => {
    const handle = (event) => {
      const err = event.detail;
      if (!err) return;

      const isDuplicate = errors.some(
        (e) =>
          e.code === err.code &&
          e.message === err.message &&
          e.statusCode === err.statusCode,
      );
      if (isDuplicate) return;

      setErrors((prev) => {
        const filtered = prev.filter(
          (e) => !(SUPPRESSED_CODES.has(e.code) && e.code === err.code),
        );
        return [...filtered, err].slice(-3);
      });
    };
    window.addEventListener('api:error', handle);
    return () => window.removeEventListener('api:error', handle);
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div role="region" aria-label="Erreurs de requête" className="mb-4 space-y-2">
      {errors.map((error, idx) => (
        <div
          key={`${error.code}-${idx}`}
          role="alert"
          className="flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-red-300 bg-red-50 p-4 text-red-900 shadow-[var(--shadow-card)]"
        >
          <div>
            <strong>La requête a échoué.</strong> {String(error.message)}
            {error.traceId && <div>Trace : <code>{error.traceId}</code></div>}
          </div>
          <button
            type="button"
            className="ml-4 shrink-0 rounded-md px-2 py-1 text-sm underline underline-offset-2 hover:bg-red-100 focus-visible:outline-red-700"
            aria-label={`Fermer l'erreur : ${String(error.message)}`}
            onClick={() =>
              setErrors((prev) => prev.filter((e) => e !== error))
            }
          >
            Fermer
          </button>
        </div>
      ))}
    </div>
  );
}
