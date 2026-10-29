import React from 'react';
import {
  CommandLineIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function RuntimeContextCard({ context }) {
  const fields = [
    { label: 'Tenant', value: context?.tenantId || '00000000-0000-0000-0000-000000000000' },
    { label: 'Application', value: context?.applicationId || 'techzone-cloud' },
    { label: 'Version App', value: '1.2.4' },
    { label: 'Version Pack', value: '2.0.1-stable' },
    { label: 'Environnement', value: context?.environmentId || 'production' },
    { label: 'Resolution ID', value: context?.requestId || 'req-default-001' },
    { label: 'Utilisateur', value: context?.userId || 'system' },
  ];

  return (
    <div className="tz-surface p-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
          <CpuChipIcon className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-slate-900">Contexte Runtime</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        {fields.map(f => (
          <div key={f.label} className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4 py-1">
            <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.label}</dt>
            <dd className="text-sm font-mono text-slate-700 truncate">{f.value}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataAccessBlocked({ code, correlationId }) {
  return (
    <div className="tz-surface border-red-200 bg-red-50 p-8 text-center animate-in zoom-in-95 duration-300">
      <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6 shadow-sm border border-red-200">
        <ShieldExclamationIcon className="h-10 w-10" />
      </div>
      <h2 className="text-xl font-bold text-red-900">DATA ACCESS BLOCKED</h2>
      <p className="mt-2 text-sm text-red-700 max-w-md mx-auto leading-relaxed">
        L'accès aux données a été interrompu par le moteur de sécurité Runtime.
        Veuillez vérifier vos permissions ou la résolution du contrat.
      </p>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 rounded-lg shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Code</span>
          <code className="text-xs font-bold text-red-600">{code || 'RUNTIME_FORBIDDEN_001'}</code>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 rounded-lg shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Correlation ID</span>
          <code className="text-xs font-mono text-slate-600">{correlationId || 'tr-abc-123-xyz'}</code>
        </div>
      </div>
      <button className="mt-8 inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
        <ArrowPathIcon className="h-4 w-4" />
        Réessayer la résolution
      </button>
    </div>
  );
}

export function TransactionalDiagnostics({ traceDetail }) {
  return (
    <div className="tz-surface overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CommandLineIcon className="h-5 w-5 text-emerald-400" />
          <h3 className="font-bold text-white">Diagnostics Transactionnels</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">ID: {traceDetail?.traceId || 'N/A'}</span>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: traceDetail?.status || 'SUCCESS', color: 'text-emerald-500' },
            { label: 'Duration', value: `${traceDetail?.durationMs || 42} ms`, color: 'text-blue-400' },
            { label: 'Rollback', value: traceDetail?.rollback ? 'YES' : 'NO', color: traceDetail?.rollback ? 'text-red-400' : 'text-slate-400' },
            { label: 'Isolation', value: 'SERIALIZABLE', color: 'text-amber-400' },
          ].map(m => (
            <div key={m.label} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</p>
              <p className={`text-sm font-bold mt-1 ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            Timeline d'audit d'exécution
          </h4>
          <div className="space-y-0 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {(traceDetail?.timeline || [
              { stage: 'AUTH_VALIDATION', message: 'User identity verified', timestamp: '2026-10-29T14:22:01Z', status: 'OK' },
              { stage: 'POLICY_EVALUATION', message: 'Row policy "Restrict to own" applied', timestamp: '2026-10-29T14:22:01.05Z', status: 'OK' },
              { stage: 'PROVIDER_CALL', message: 'Invoking PostgreSQL provider (internal)', timestamp: '2026-10-29T14:22:01.12Z', status: 'OK' },
              { stage: 'DATA_MASKING', message: 'Field "price" partially masked', timestamp: '2026-10-29T14:22:01.20Z', status: 'OK' },
            ]).map((step, i) => (
              <div key={i} className="relative pl-8 py-3 group">
                <div className={`absolute left-0 top-4 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                  step.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{step.stage}</p>
                    <p className="text-xs text-slate-500 mt-1">{step.message}</p>
                  </div>
                  <time className="text-[10px] text-slate-400 font-mono">{step.timestamp.split('T')[1].replace('Z', '')}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
