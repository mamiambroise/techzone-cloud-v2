import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function erpFailure(error) {
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code)) return { code: 'INTEGRATION_TIMEOUT', message: 'Le délai de chargement ERP est dépassé.', statusCode: 504 };
  const body = error?.response?.data || error?.normalized || error || {};
  return { code: body.code || 'INTEGRATION_INTERNAL_ERROR', message: body.message || 'Données indisponibles.', traceId: body.traceId, statusCode: error?.response?.status || body.statusCode };
}
export const isUnconfigured = error => ['ERP_INSTANCE_NOT_CONFIGURED', 'CONNECTOR_NOT_CONFIGURED', 'CONNECTOR_NOT_FOUND'].includes(erpFailure(error).code);

export default function ErpErrorPanel({ errors = [], onRetry, onRetryAll, onDismiss }) {
  const [copied, setCopied] = useState('');
  const unique = [...new Map(errors.map(item => [`${item.resource}:${erpFailure(item.error).code}`, item])).values()];
  if (!unique.length) return null;
  const unconfigured = unique.every(item => isUnconfigured(item.error));
  return <section aria-label="Erreurs ERP" className={`rounded-xl border p-5 space-y-3 ${unconfigured ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">{unconfigured ? 'ERP non configuré' : 'Certaines ressources ERP sont indisponibles'}</h2>
      <div className="flex gap-3">{onRetryAll && <button className="text-sm underline" onClick={onRetryAll}>Tout réessayer</button>}{onDismiss && <button className="text-sm underline" onClick={onDismiss}>Fermer</button>}</div>
    </div>
    {unconfigured ? <><p>Aucune connexion Dolibarr complète n’est configurée.</p><Link className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white" to="/settings/erp">Configurer la connexion</Link></> :
      <ul className="space-y-3">{unique.map(({ resource, label, error }) => { const detail = erpFailure(error); return <li key={resource} className="border-t border-amber-200 pt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="font-medium">{label || resource}</p><p className="text-sm">{String(detail.message)}</p><p className="text-xs text-slate-600 break-all">{detail.code}{detail.traceId && ` · ${detail.traceId}`}</p></div>
        <div className="flex gap-3 text-sm">{detail.traceId && <button onClick={async () => { try { await navigator.clipboard.writeText(detail.traceId); setCopied(detail.traceId); } catch { setCopied('Copie impossible'); } }}>Copier traceId</button>}{onRetry && <button className="underline" onClick={() => onRetry(resource)}>Réessayer</button>}</div>
      </li>; })}</ul>}
    {copied && <p role="status" className="text-xs">{copied === 'Copie impossible' ? copied : 'TraceId copié'}</p>}
  </section>;
}
