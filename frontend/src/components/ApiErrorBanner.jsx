import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function ApiErrorBanner() {
  const [error, setError] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => { setError(null); }, [pathname]);
  useEffect(() => {
    const handle = event => setError(event.detail);
    window.addEventListener('api:error', handle);
    return () => window.removeEventListener('api:error', handle);
  }, []);
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-red-900">
    <strong>La requête a échoué.</strong> {String(error.message)}
    {error.traceId && <div>Trace : <code>{error.traceId}</code></div>}
    <button className="ml-4 underline" onClick={() => setError(null)}>Fermer</button>
  </div>;
}
