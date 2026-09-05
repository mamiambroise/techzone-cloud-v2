import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedApiId,
  updateApiStatus,
  addApi,
} from '../../store/integrationSlice.js';
import { logAuditAction } from '../../store/auditSlice.js';
import { addToast, setSearchQuery } from '../../store/platformSlice.js';
import {
  Cpu,
  Plus,
  Play,
  Shield,
  Layers,
  FileCode2,
  Lock,
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code,
  Terminal,
  Filter,
  X,
  Search,
  Sliders,
  Send,
} from 'lucide-react';

export default function ApiManagerView() {
  const dispatch = useDispatch();

  const apis = useSelector((state) => state.integration.apis);
  const selectedApiId = useSelector((state) => state.integration.selectedApiId);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const activeTenant = useSelector((state) => state.platform.activeTenant);

  const [activeTab, setActiveTab] = useState('SPEC'); // 'SPEC' or 'PLAYGROUND'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  // Playground state
  const [testMethod, setTestMethod] = useState('POST');
  const [testPath, setTestPath] = useState('/');
  const [testIdempotencyKey, setTestIdempotencyKey] = useState('idemp-' + Date.now().toString(36));
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        orderRef: 'ORD-2026-X99',
        customerId: 'CUST-8832',
        totalAmount: 189.5,
        currency: 'EUR',
        items: [{ sku: 'SKU-LOG-90', qty: 2, unitPrice: 94.75 }],
      },
      null,
      2
    )
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  // New API Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('v1.0.0');
  const [newBasePath, setNewBasePath] = useState('/api/v1/');
  const [newRateLimit, setNewRateLimit] = useState('120 req/min');

  // Filter APIs
  const filteredApis = apis.filter((api) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      api.apiCode.toLowerCase().includes(q) ||
      api.name.toLowerCase().includes(q) ||
      api.basePath.toLowerCase().includes(q) ||
      api.version.toLowerCase().includes(q)
    );
  });

  const selectedApi = apis.find((a) => a.id === selectedApiId) || filteredApis[0] || apis[0];

  const handleExecutePlayground = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      const traceId = 'tr-int-' + Math.random().toString(36).substr(2, 8);
      const simulatedResponse = {
        status: 201,
        statusText: 'Created',
        latencyMs: Math.floor(Math.random() * 50) + 40,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-trace-id': traceId,
          'x-ratelimit-limit': selectedApi?.rateLimit || '250',
          'x-ratelimit-remaining': '248',
          'x-idempotency-replayed': 'false',
        },
        data: {
          success: true,
          traceId,
          contractValidated: true,
          schemaMatched: selectedApi?.responseSchema,
          timestamp: new Date().toISOString(),
          record: {
            id: 'REC-' + Math.floor(10000 + Math.random() * 90000),
            status: 'ACCEPTED_BY_TECHZONE_LAYER',
            idempotencyKey: testIdempotencyKey,
          },
        },
      };

      setTestResponse(simulatedResponse);
      dispatch(
        addToast({
          type: 'success',
          title: 'Exécution API Validée (API-CDC-03)',
          message: `Endpoint ${selectedApi?.basePath} a répondu en ${simulatedResponse.latencyMs}ms avec conformité contractuelle.`,
        })
      );
      dispatch(
        logAuditAction({
          action: 'EXECUTE_API_PLAYGROUND',
          resourceType: 'API_ENDPOINT',
          resourceId: selectedApi?.id,
          user: activeUser,
          details: {
            basePath: selectedApi?.basePath,
            method: testMethod,
            traceId,
            idempotencyKey: testIdempotencyKey,
          },
        })
      );
    }, 500);
  };

   const handleCreateApi = (e) => {
     e.preventDefault();
     if (!newCode.trim() || !newName.trim()) return;

     const newId = 'api-' + newCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
     const newApiObj = {
       id: newId,
       apiCode: newCode.toUpperCase().trim(),
       name: newName.trim(),
       version: newVersion.trim(),
       basePath: newBasePath.trim(),
       operations: [
         { method: 'GET', path: '/', summary: 'Lister et paginer', rateLimit: newRateLimit },
         { method: 'POST', path: '/', summary: 'Créer ressource', idempotencyRequired: true, rateLimit: newRateLimit },
       ],
       authentication: 'BEARER_JWT',
       authorization: ['tenant.scope', 'read', 'write'],
       rateLimit: newRateLimit,
       status: 'PUBLISHED',
       requestSchema: `${newCode}_RequestSchema`,
       responseSchema: `${newCode}_ResponseSchema`,
       totalRequests24h: 0,
       errorRatePct: 0.0,
       p95LatencyMs: 85,
     };

     dispatch(addApi(newApiObj));
     dispatch(
       logAuditAction({
         action: 'CREATE_API_DEFINITION',
         resourceType: 'API_DEFINITION',
         resourceId: newId,
         user: activeUser,
         details: { apiCode: newApiObj.apiCode, version: newApiObj.version, basePath: newApiObj.basePath },
       })
     );
     setShowCreateModal(false);
     setNewCode('');
     setNewName('');

     dispatch(
       addToast({
         type: 'success',
         title: 'API Exposée Enregistrée (API-CDC-03)',
         message: `L'API ${newApiObj.apiCode} (${newApiObj.version}) a été créée avec son contrat.`,
       })
     );
   };

   const handlePublishApi = (api) => {
     if (api.status !== 'DRAFT') return;
     dispatch(updateApiStatus({ id: api.id, status: 'PUBLISHED' }));
     dispatch(
       logAuditAction({
         action: 'PUBLISH_API_DEFINITION',
         resourceType: 'API_DEFINITION',
         resourceId: api.id,
         user: activeUser,
         details: { apiCode: api.apiCode, previousStatus: 'DRAFT', newStatus: 'PUBLISHED' },
       })
     );
     dispatch(
       addToast({
         type: 'success',
         title: 'API Publiée (API-CDC-03)',
         message: `L'API ${api.apiCode} est maintenant PUBLISHED.`,
       })
     );
   };

   const handleDeprecateApi = (api) => {
     if (api.status !== 'PUBLISHED') return;
     dispatch(updateApiStatus({ id: api.id, status: 'DEPRECATED' }));
     dispatch(
       logAuditAction({
         action: 'DEPRECATE_API_DEFINITION',
         resourceType: 'API_DEFINITION',
         resourceId: api.id,
         user: activeUser,
         details: { apiCode: api.apiCode, previousStatus: 'PUBLISHED', newStatus: 'DEPRECATED' },
       })
     );
     dispatch(
       addToast({
         type: 'warning',
         title: 'API Dépréciée (API-CDC-03)',
         message: `L'API ${api.apiCode} est marquée DEPRECATED.`,
       })
     );
   };

   const handleRetireApi = (api) => {
     if (api.status !== 'DEPRECATED') return;
     dispatch(updateApiStatus({ id: api.id, status: 'RETIRED' }));
     dispatch(
       logAuditAction({
         action: 'RETIRE_API_DEFINITION',
         resourceType: 'API_DEFINITION',
         resourceId: api.id,
         user: activeUser,
         details: { apiCode: api.apiCode, previousStatus: 'DEPRECATED', newStatus: 'RETIRED' },
       })
     );
     dispatch(
       addToast({
         type: 'info',
         title: 'API Retirée (API-CDC-03)',
         message: `L'API ${api.apiCode} est maintenant RETIRED.`,
       })
     );
   };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200">
              API-CDC-03
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">API Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Exposition Contrôlée des APIs
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredApis.length} contrat(s) API
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Contrats versionnés, contrôle IAM & scopes, rate limiting strict, clés d'idempotence et validation de schémas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEndpointsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-600" />
            <span>Endpoints NestJS (§9)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle API</span>
          </button>
        </div>
      </div>

      {/* NestJS Endpoints Modal for APIs (API-CDC-03 §9) */}
      {showEndpointsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px] font-bold border border-sky-200">
                  API-CDC-03 §9
                </span>
                <h3 className="text-sm font-bold text-slate-900">Endpoints Backend NestJS — API Manager</h3>
              </div>
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Contrats d'APIs REST NestJS dédiés à la publication, documentation et sécurisation des interfaces :
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Catalogue des APIs publiées</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Créer une nouvelle spécification API</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Schémas JSON et politique rate-limiting</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">PATCH</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Mettre à jour quotas ou autorisations</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis/:id/publish</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Passer l'API à l'état PUBLISHED</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis/:id/deprecate</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Déprécier une version contractuelle</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/apis/:id/execute</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Exécution sandbox dans le Test Console</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-sky-50/90 border border-sky-200/90 rounded-2xl text-xs text-sky-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredApis.length} API(s) trouvée(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left APIs Catalog, Right Details & Interactive Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: APIs Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {filteredApis.map((api) => {
            const isSelected = api.id === selectedApi?.id;
            return (
              <div
                key={api.id}
                onClick={() => dispatch(setSelectedApiId(api.id))}
                className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/50 border-sky-300 ring-2 ring-sky-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{api.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">
                        {api.version}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{api.basePath}</div>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {api.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  <span>Limite: {api.rateLimit}</span>
                  <span>p95: {api.p95LatencyMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: API Inspector & Playground (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedApi && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-sky-700">{selectedApi.apiCode}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedApi.basePath}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                      {selectedApi.version}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedApi.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApi.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishApi(selectedApi)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Publier</span>
                    </button>
                  )}
                  {selectedApi.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleDeprecateApi(selectedApi)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Déprécier</span>
                    </button>
                  )}
                  {selectedApi.status === 'DEPRECATED' && (
                    <button
                      onClick={() => handleRetireApi(selectedApi)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>
                  )}
                </div>

                {/* Tab Switcher: Spec vs Playground */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('SPEC')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'SPEC' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Spécification & Contrat
                  </button>
                  <button
                    onClick={() => setActiveTab('PLAYGROUND')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'PLAYGROUND'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Test Console</span>
                  </button>
                </div>
              </div>

              {activeTab === 'SPEC' ? (
                <div className="space-y-6">
                  {/* Security & Rate Limiting Overview (API-CDC-03 Section 4) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Authentification</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{selectedApi.authentication}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rate Limiting</span>
                      <span className="font-bold text-sky-700 mt-0.5 block">{selectedApi.rateLimit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scopes Requis</span>
                      <span className="font-bold text-slate-800 mt-0.5 block truncate">
                        {selectedApi.authorization?.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Operations Table (API-CDC-03 Section 2) */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-3">
                      Opérations Enregistrées
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                      {selectedApi.operations?.map((op, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3 font-mono text-xs">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                op.method === 'GET'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : op.method === 'POST'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {op.method}
                            </span>
                            <span className="font-semibold text-slate-800">{selectedApi.basePath}{op.path}</span>
                            <span className="text-slate-400 text-[11px] font-sans">— {op.summary}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            {op.idempotencyRequired && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                                Idempotency 🔑
                              </span>
                            )}
                            <span className="text-slate-400">{op.rateLimit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contract Schemas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 font-mono">Schéma Requête</span>
                        <span className="text-[10px] font-mono text-slate-400">{selectedApi.requestSchema}</span>
                      </div>
                      <div className="bg-slate-900 text-slate-300 p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto">
                        <pre>{`{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "required": ["tenantId", "payload"],\n  "properties": {\n    "tenantId": { "type": "string" },\n    "payload": { "type": "object" }\n  }\n}`}</pre>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 font-mono">Schéma Réponse</span>
                        <span className="text-[10px] font-mono text-slate-400">{selectedApi.responseSchema}</span>
                      </div>
                      <div className="bg-slate-900 text-slate-300 p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto">
                        <pre>{`{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "success": { "type": "boolean" },\n    "traceId": { "type": "string" },\n    "data": { "type": "object" }\n  }\n}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive API Playground Console */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={testMethod}
                        onChange={(e) => setTestMethod(e.target.value)}
                        className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-800"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                      </select>
                      <div className="font-mono text-xs text-slate-500 font-semibold">
                        {selectedApi.basePath}{testPath}
                      </div>
                    </div>

                    <button
                      onClick={handleExecutePlayground}
                      disabled={isExecuting}
                      className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Send className={`w-3.5 h-3.5 ${isExecuting ? 'animate-pulse' : ''}`} />
                      <span>{isExecuting ? 'Appel en cours...' : 'Envoyer la requête'}</span>
                    </button>
                  </div>

                  {/* Idempotency Key Input (API-CDC-03 Section 5) */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-900">Idempotency-Key Header:</span>
                      <input
                        type="text"
                        value={testIdempotencyKey}
                        onChange={(e) => setTestIdempotencyKey(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <span className="text-[11px] text-amber-700 font-sans">
                      Empêche les doublons en cas de retry réseau
                    </span>
                  </div>

                  {/* Payload Editor */}
                  <div>
                    <label className="font-mono text-xs font-bold text-slate-700 block mb-1">
                      Corps de la requête (JSON)
                    </label>
                    <textarea
                      rows={5}
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  {/* Response Display */}
                  {testResponse && (
                    <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                            {testResponse.status} {testResponse.statusText}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-400">{testResponse.latencyMs}ms</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Trace: {testResponse.headers['x-trace-id']}</span>
                      </div>
                      <pre className="overflow-x-auto text-emerald-300">
                        {JSON.stringify(testResponse.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create API Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Publier une API Contrôlée</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Conforme au contrat API-CDC-03</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApi} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code API *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="EX: INVENTORY-API"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Version Sémantique</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom de l'API *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="EX: API Gestion des Stocks Logistiques"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chemin de base (Base Path)</label>
                  <input
                    type="text"
                    value={newBasePath}
                    onChange={(e) => setNewBasePath(e.target.value)}
                    placeholder="/api/v1/inventory"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rate Limit</label>
                  <input
                    type="text"
                    value={newRateLimit}
                    onChange={(e) => setNewRateLimit(e.target.value)}
                    placeholder="120 req/min"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Publier l'API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
