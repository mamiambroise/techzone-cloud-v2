import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const RESOURCE_LABELS = {
  erps: 'Registre ERP',
  automation: 'Automation',
  health: 'Santé ERP',
  metrics: 'Statistiques',
  orders: 'Commandes',
  invoices: 'Factures',
  products: 'Produits',
  clients: 'Clients',
  documents: 'Documents',
};

function normalize(err) {
  const normalized = err?.normalized || null;
  const data = err?.response?.data || {};
  const code = normalized?.code ?? data.code ?? err?.code ?? null;
  const type = normalized?.type ?? null;
  const message =
    normalized?.message ?? data.message ?? err?.message ?? 'Données indisponibles';
  const traceId = normalized?.traceId ?? data.traceId ?? err?.traceId ?? null;
  const unconfigured =
    type === 'ERP_NOT_CONFIGURED' || code === 'ERP_INSTANCE_NOT_CONFIGURED';
  return { code, message, traceId, unconfigured };
}

/**
 * Un seul panneau par erreur unique (dédupliquée) : les ressources partageant
 * la même erreur sont listées sur le même panneau. L'état « non configuré »
 * propose le CTA vers la configuration de la connexion ERP.
 */
export default function ErpErrorPanel({ errors }) {
  const groups = React.useMemo(() => {
    const bySignature = new Map();
    for (const [resource, err] of Object.entries(errors || {})) {
      const n = normalize(err);
      const key = `${n.unconfigured ? 'UNCONFIGURED' : n.code || 'ERROR'}::${n.message}`;
      if (!bySignature.has(key)) bySignature.set(key, { ...n, resources: [] });
      bySignature.get(key).resources.push(resource);
    }
    return [...bySignature.values()];
  }, [errors]);

  if (groups.length === 0) return null;

  return (
    <div role="alert" className="space-y-3">
      {groups.map((group) => {
        const signature = `${group.code || 'ERROR'}::${group.message}`;
        if (group.unconfigured) {
          return (
            <div
              key={signature}
              className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-900/20 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      ERP non configuré — connexion à rétablir
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                      Aucune connexion ERP active pour ce tenant. Les données suivantes
                      sont indisponibles :
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.resources.map((resource) => (
                        <span
                          key={resource}
                          className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                        >
                          {RESOURCE_LABELS[resource] || resource}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  to="/settings/erp"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
                >
                  Configurer la connexion
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        }
        return (
          <div
            key={signature}
            className="rounded-xl border border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-900/30 p-4"
          >
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {group.message}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.resources.map((resource) => (
                    <span
                      key={resource}
                      className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300"
                    >
                      {RESOURCE_LABELS[resource] || resource}
                    </span>
                  ))}
                </div>
                {group.traceId && (
                  <p className="text-xs text-red-400 dark:text-red-500 mt-2">
                    TraceId : <code>{group.traceId}</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
