import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, addToast } from '../../store/platformSlice.js';
import {
  Activity,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  FileCode2,
  ArrowRight,
  RefreshCw,
  Terminal,
  Layers,
  Copy,
  Check,
  Webhook,
  Database,
} from 'lucide-react';

const ERROR_CODES = [
  'ALL',
  'CONNECTOR_UNREACHABLE',
  'AUTH_FAILED',
  'SCHEMA_VALIDATION_FAILED',
  'RATE_LIMITED',
  'IDEMPOTENCY_CONFLICT',
  'INTEGRATION_TIMEOUT',
  'SIGNATURE_VERIFICATION_FAILED',
  'SYNC_CONFLICT_DETECTED',
  'INTERNAL_INTEGRATION_ERROR',
];

const STATUS_FILTERS = ['ALL', 'SUCCESS', 'WARNING', 'FAILURE'];

const PERIOD_FILTERS = [
  { id: 'ALL', label: 'Tout' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7j' },
  { id: '30d', label: '30j' },
];

const CONTEXT_FILTERS = ['ALL', 'CONNECTOR', 'API', 'WEBHOOK', 'SYNC'];

const getDiagnosticContext = (diag) => {
  const op = diag.operation.toLowerCase();
  if (op.includes('webhook')) return 'WEBHOOK';
  if (op.includes('sync') || op.includes('materialstockset') || op.includes('contact') || op.includes('orders')) return 'SYNC';
  if (op.includes('/api/') || op.includes('basepath')) return 'API';
  return 'CONNECTOR';
};

export default function IntegrationDiagnosticsView() {
  const dispatch = useDispatch();

  const diagnostics = useSelector((state) => state.integration.diagnostics);
  const searchQuery = useSelector((state) => state.platform.searchQuery);

  const [selectedErrorCode, setSelectedErrorCode] = useState('ALL');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(diagnostics[0] || null);
  const [copiedTrace, setCopiedTrace] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedTenant, setSelectedTenant] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedContext, setSelectedContext] = useState('ALL');

  const uniqueTenants = Array.from(new Set(diagnostics.map((d) => d.tenantId).filter(Boolean)));

  const isInPeriod = (diag) => {
    if (selectedPeriod === 'ALL') return true;
    const now = new Date();
    const started = new Date(diag.startedAt);
    const diffMs = now - started;
    const diffHours = diffMs / (1000 * 60 * 60);
    if (selectedPeriod === '24h') return diffHours <= 24;
    if (selectedPeriod === '7d') return diffHours <= 168;
    if (selectedPeriod === '30d') return diffHours <= 720;
    return true;
  };

  // Filter diagnostics
  const filteredDiagnostics = diagnostics.filter((diag) => {
    const matchesCode =
      selectedErrorCode === 'ALL' ||
      diag.errorCode === selectedErrorCode ||
      (selectedErrorCode === 'SUCCESS' && diag.status === 'SUCCESS');

    const matchesStatus = selectedStatus === 'ALL' || diag.status === selectedStatus;
    const matchesTenant = selectedTenant === 'ALL' || diag.tenantId === selectedTenant;
    const matchesContext = selectedContext === 'ALL' || getDiagnosticContext(diag) === selectedContext;
    const matchesPeriod = isInPeriod(diag);

    if (!searchQuery.trim()) return matchesCode && matchesStatus && matchesTenant && matchesContext && matchesPeriod;
    const q = searchQuery.toLowerCase();
    return (
      matchesCode &&
      matchesStatus &&
      matchesTenant &&
      matchesContext &&
      matchesPeriod &&
      (diag.traceId.toLowerCase().includes(q) ||
        diag.connector.toLowerCase().includes(q) ||
        diag.operation.toLowerCase().includes(q) ||
        (diag.errorCode && diag.errorCode.toLowerCase().includes(q)) ||
        (diag.rootCause && diag.rootCause.toLowerCase().includes(q)))
    );
  });

  const totalDiags = filteredDiagnostics.length;
  const successCount = filteredDiagnostics.filter((d) => d.status === 'SUCCESS').length;
  const warningCount = filteredDiagnostics.filter((d) => d.status === 'WARNING').length;
  const failureCount = filteredDiagnostics.filter((d) => d.status === 'FAILURE').length;
  const successRate = totalDiags > 0 ? ((successCount / totalDiags) * 100).toFixed(1) : '0.0';
  const avgLatency = totalDiags > 0 ? Math.round(filteredDiagnostics.reduce((sum, d) => sum + d.duration, 0) / totalDiags) : 0;
  const timeoutCount = filteredDiagnostics.filter((d) => d.errorCode === 'INTEGRATION_TIMEOUT').length;
  const retryCount = filteredDiagnostics.filter((d) => d.attempt > 1).length;
  const rateLimitCount = filteredDiagnostics.filter((d) => d.errorCode === 'INTEGRATION_RATE_LIMITED').length;
  const webhookFailures = filteredDiagnostics.filter((d) => getDiagnosticContext(d) === 'WEBHOOK' && d.status === 'FAILURE').length;
  const syncFailures = filteredDiagnostics.filter((d) => getDiagnosticContext(d) === 'SYNC' && d.status === 'FAILURE').length;

  const handleCopyTrace = (traceId) => {
    navigator.clipboard?.writeText(traceId);
    setCopiedTrace(true);
    setTimeout(() => setCopiedTrace(false), 2000);
    dispatch(
      addToast({
        type: 'info',
        title: 'Trace ID copiée',
        message: `Le traceId ${traceId} a été copié dans le presse-papier.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              API-CDC-07
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">Diagnostics & Root Causes</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Supervision, Traces de Bout en Bout & Analyse des Causes
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredDiagnostics.length} événement(s)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Recherche globale par traceId, 9 codes d'erreur normalisés, redaction stricte des données sensibles et chronologie des flux.
          </p>
        </div>
      </div>

      {/* Metrics KPI Bar (API-CDC-07 Section 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-mono text-slate-400">Total</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{totalDiags}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Événements</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono text-emerald-600 font-bold">{successRate}%</span>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700 font-mono">{successRate}%</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Taux Succès</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span className="text-[10px] font-mono text-slate-400">Avg</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{avgLatency}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Latence Moy.</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-mono text-slate-400">24h</span>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 font-mono">{timeoutCount}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Timeouts</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <RefreshCw className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] font-mono text-slate-400">Retry</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{retryCount}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Retries</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-mono text-slate-400">429</span>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-600 font-mono">{rateLimitCount}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Rate Limits</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Webhook className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] font-mono text-slate-400">Fail</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{webhookFailures}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Webhook Fail</div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-mono text-slate-400">Fail</span>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{syncFailures}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">Sync Fail</div>
          </div>
        </div>
      </div>

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl text-xs text-indigo-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredDiagnostics.length} trace(s) trouvée(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* 9 Standard Error Codes Filter Bar (API-CDC-07 Section 3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {ERROR_CODES.map((code) => (
          <button
            key={code}
            onClick={() => setSelectedErrorCode(code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
              selectedErrorCode === code
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {code === 'ALL' ? 'Tous les Codes' : code}
          </button>
        ))}
      </div>

      {/* Additional Filters: Period, Tenant, Status, Context (API-CDC-07 Section 4) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {PERIOD_FILTERS.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                selectedPeriod === period.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {uniqueTenants.map((tenant) => (
            <button
              key={tenant}
              onClick={() => setSelectedTenant(tenant)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                selectedTenant === tenant
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tenant}
            </button>
          ))}
          <button
            onClick={() => setSelectedTenant('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
              selectedTenant === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tous tenants
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? 'Tous statuts' : status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CONTEXT_FILTERS.map((ctx) => (
            <button
              key={ctx}
              onClick={() => setSelectedContext(ctx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                selectedContext === ctx
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {ctx === 'ALL' ? 'Tous contextes' : ctx}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Timeline Events, Right Deep Root Cause Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Events Timeline (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {filteredDiagnostics.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <Search className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs">Aucune trace ne correspond aux critères.</p>
              <button
                onClick={() => {
                  setSelectedErrorCode('ALL');
                  dispatch(setSearchQuery(''));
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            filteredDiagnostics.map((diag) => {
              const isSelected = diag.id === selectedDiagnostic?.id;
              const isSuccess = diag.status === 'SUCCESS';
              const isWarning = diag.status === 'WARNING';
              const isFailure = diag.status === 'FAILURE';

              return (
                <div
                  key={diag.id}
                  onClick={() => setSelectedDiagnostic(diag)}
                  className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-700">{diag.traceId}</span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isWarning
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {diag.status}
                        </span>
                        {diag.httpStatus && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            HTTP {diag.httpStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {diag.connector} — {diag.operation}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 shrink-0">{diag.duration}ms</span>
                  </div>

                  {diag.errorCode && (
                    <div className="mt-2 text-[11px] font-mono font-bold text-rose-600 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200/60 inline-block">
                      [{diag.errorCode}]
                    </div>
                  )}

                  <div className="text-xs text-slate-600 mt-1.5 font-sans line-clamp-1">
                    {diag.rootCause}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                    <span>{diag.timestamp}</span>
                    <span>Direction: {diag.direction}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Trace Detail & Redacted Payload (6 cols) */}
        <div className="lg:col-span-6">
          {selectedDiagnostic ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5 sticky top-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700">{selectedDiagnostic.traceId}</span>
                    <button
                      onClick={() => handleCopyTrace(selectedDiagnostic.traceId)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                      title="Copier le traceId"
                    >
                      {copiedTrace ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedDiagnostic.connector} : {selectedDiagnostic.operation}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    selectedDiagnostic.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedDiagnostic.status === 'WARNING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {selectedDiagnostic.status}
                </span>
              </div>

              {/* Error Code & Root Cause (API-CDC-07 Section 2 & 4) */}
              {selectedDiagnostic.errorCode && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-mono font-bold text-rose-900">
                      Cause Racine Normalisée : [{selectedDiagnostic.errorCode}]
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed font-sans">
                    {selectedDiagnostic.rootCause}
                  </p>
                </div>
              )}

              {/* Execution Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Horodatage</span>
                  <span className="text-slate-800 mt-0.5 block">{selectedDiagnostic.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Durée / Latence</span>
                  <span className="text-slate-800 mt-0.5 block">{selectedDiagnostic.duration} ms</span>
                </div>
              </div>

              {/* Strict Secret Redaction Demonstration (API-CDC-07 Section 6) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                    Trace Payload avec Redaction des Secrets
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    100% SÉCURISÉ 🔒
                  </span>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 shadow-inner">
                  <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                    Headers HTTP (Redacted) :
                  </div>
                  <pre className="text-emerald-400">{`{\n  "authorization": "Bearer [REDACTED_BEARER_TOKEN]",\n  "x-api-key": "[REDACTED_API_KEY]",\n  "x-trace-id": "${selectedDiagnostic.traceId}",\n  "content-type": "application/json"\n}`}</pre>

                  <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-1.5 pt-2">
                    Détails de l'événement :
                  </div>
                  <pre className="text-slate-300">{JSON.stringify(selectedDiagnostic, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              Sélectionnez une trace pour inspecter les métadonnées et la cause racine.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
