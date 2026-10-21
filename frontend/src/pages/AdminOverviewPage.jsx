import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Building2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { iamAdminService, iamObservabilityService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';

const itemsOf = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
};

function Metric({ icon: Icon, label, value, unavailable }) {
  return <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-[var(--color-text-secondary)]">{label}</p><Icon size={18} className="text-[var(--color-primary)]" aria-hidden="true" /></div>
    <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{unavailable ? 'Indisponible' : value}</p>
  </section>;
}

export default function AdminOverviewPage() {
  const [state, setState] = useState({ loading: true, sources: {}, errors: [] });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, errors: [] }));
    const results = await Promise.allSettled([
      iamAdminService.tenants({ limit: 100 }),
      iamAdminService.users({ limit: 100 }),
      iamAdminService.roles(),
      iamObservabilityService.alertInstances({ status: 'OPEN' }),
    ]);
    const [tenants, users, roles, alerts] = results.map((result) => result.status === 'fulfilled' ? result.value.data : null);
    setState({
      loading: false,
      sources: { tenants: itemsOf(tenants, ['tenants', 'items']), users: itemsOf(users, ['users', 'items']), roles: itemsOf(roles, ['roles', 'items']), alerts: itemsOf(alerts, ['alerts', 'items']) },
      errors: results.flatMap((result, index) => result.status === 'rejected' ? [['tenants', 'utilisateurs', 'rôles', 'alertes'][index]] : []),
    });
  }, []);
  useEffect(() => { load(); }, [load]);
  if (state.loading) return <div className="flex min-h-[320px] items-center justify-center"><ModernSpinner /></div>;
  const unavailable = (source) => state.errors.includes(source);
  const activeTenants = state.sources.tenants.filter((tenant) => tenant.status === 'ACTIVE').length;
  const activeUsers = state.sources.users.filter((user) => ['ACTIVE', 'active'].includes(user.status)).length;
  return <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6" aria-labelledby="admin-overview-title">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="admin-overview-title" className="text-xl font-semibold text-[var(--color-text)]">Vue d’ensemble</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Indicateurs issus des services IAM et Observabilité disponibles.</p></div><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"><RefreshCw size={16} />Actualiser</button></header>
    {state.errors.length > 0 && <p role="alert" className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-text)]">Sources indisponibles : {state.errors.join(', ')}. Les autres indicateurs restent affichés.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Building2} label="Tenants actifs" value={activeTenants} unavailable={unavailable('tenants')} />
      <Metric icon={Users} label="Utilisateurs actifs" value={activeUsers} unavailable={unavailable('utilisateurs')} />
      <Metric icon={ShieldCheck} label="Rôles enregistrés" value={state.sources.roles.length} unavailable={unavailable('rôles')} />
      <Metric icon={AlertTriangle} label="Alertes ouvertes" value={state.sources.alerts.length} unavailable={unavailable('alertes')} />
    </div>
  </main>;
}
