import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedWebhookId,
  triggerTestWebhook,
  addWebhook,
} from '../../store/integrationSlice.js';
import { logAuditAction } from '../../store/auditSlice.js';
import { addToast, setSearchQuery } from '../../store/platformSlice.js';
import {
  Webhook,
  Plus,
  Send,
  Shield,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCode2,
  Lock,
  ArrowRight,
  Filter,
  X,
  Search,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export default function WebhookManagerView() {
  const dispatch = useDispatch();

  const webhooks = useSelector((state) => state.integration.webhooks);
  const selectedWebhookId = useSelector((state) => state.integration.selectedWebhookId);
  const deliveries = useSelector((state) => state.integration.webhookDeliveries);
  const credentials = useSelector((state) => state.integration.credentials);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeUser = useSelector((state) => state.platform.activeUser);

  const [selectedDirection, setSelectedDirection] = useState('ALL'); // 'ALL', 'INBOUND', 'OUTBOUND'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // New Webhook Form
  const [newCode, setNewCode] = useState('');
  const [newDirection, setNewDirection] = useState('OUTBOUND');
  const [newEvent, setNewEvent] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('https://webhook.site/example');
  const [newSecretRef, setNewSecretRef] = useState(credentials[0]?.id || '');
  const [newSignaturePolicy, setNewSignaturePolicy] = useState('HMAC-SHA256');
  const [newRetryMaxAttempts, setNewRetryMaxAttempts] = useState(5);
  const [newRetryBackoff, setNewRetryBackoff] = useState('EXPONENTIAL');
  const [newRetryInitialDelayMs, setNewRetryInitialDelayMs] = useState(1000);
  const [newTimeout, setNewTimeout] = useState(5000);
  const [newFilters, setNewFilters] = useState('');

  // Filter webhooks
  const filteredWebhooks = webhooks.filter((w) => {
    const matchesDirection = selectedDirection === 'ALL' || w.direction === selectedDirection;
    if (!searchQuery.trim()) return matchesDirection;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      w.code.toLowerCase().includes(q) ||
      w.event.toLowerCase().includes(q) ||
      w.endpoint.toLowerCase().includes(q) ||
      w.direction.toLowerCase().includes(q);
    return matchesDirection && matchesSearch;
  });

  const selectedWebhook =
    webhooks.find((w) => w.id === selectedWebhookId) || filteredWebhooks[0] || webhooks[0];

  const handleTestDispatch = () => {
    if (!selectedWebhook) return;
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      dispatch(
        triggerTestWebhook({
          webhookId: selectedWebhook.id,
          event: selectedWebhook.event,
          simulatedStatus: 'SUCCEEDED',
        })
      );
      dispatch(
        addToast({
          type: 'success',
          title: 'Webhook Délivré avec Succès (API-CDC-04)',
          message: `Signature HMAC-SHA256 calculée et vérifiée pour ${selectedWebhook.code}.`,
        })
      );
      dispatch(
        logAuditAction({
          action: 'DISPATCH_TEST_WEBHOOK',
          resourceType: 'WEBHOOK',
          resourceId: selectedWebhook.id,
          user: activeUser,
          details: { code: selectedWebhook.code, event: selectedWebhook.event },
        })
      );
    }, 600);
  };

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newEvent.trim()) return;

    const newId = 'wh-' + newCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newWh = {
      id: newId,
      code: newCode.toUpperCase().trim(),
      direction: newDirection,
      event: newEvent.trim(),
      endpoint: newEndpoint.trim(),
      status: 'ACTIVE',
      secretRef: newSecretRef,
      signaturePolicy: newSignaturePolicy,
      retryPolicy: { maxAttempts: newRetryMaxAttempts, backoff: newRetryBackoff, initialDelayMs: newRetryInitialDelayMs },
      timeout: newTimeout,
      filters: newFilters ? JSON.parse(newFilters) : {},
      deliveriesCount24h: 1,
      successRatePct: 100.0,
    };

    dispatch(addWebhook(newWh));
    dispatch(
      logAuditAction({
        action: 'CREATE_WEBHOOK_SUBSCRIPTION',
        resourceType: 'WEBHOOK',
        resourceId: newId,
        user: activeUser,
        details: { code: newWh.code, direction: newWh.direction, event: newWh.event, endpoint: newWh.endpoint },
      })
    );
    setShowCreateModal(false);
    setNewCode('');
    setNewEvent('');

    dispatch(
      addToast({
        type: 'success',
        title: 'Webhook Enregistré (API-CDC-04)',
        message: `Le webhook ${newWh.code} (${newWh.direction}) a été configuré avec politique de signature.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
              API-CDC-04
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">Webhook Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestionnaire de Webhooks & Signatures
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredWebhooks.length} webhook(s)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Émission (Outbound) et réception (Inbound), signatures HMAC SHA-256, déduplication et retries avec backoff exponentiel.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEndpointsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <span className="font-mono font-bold text-violet-600 text-xs">&lt;/&gt;</span>
            <span>Endpoints NestJS (§9)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Webhook</span>
          </button>
        </div>
      </div>

      {/* NestJS Endpoints Modal for Webhooks (API-CDC-04 §9) */}
      {showEndpointsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-mono text-[10px] font-bold border border-violet-200">
                  API-CDC-04 §9
                </span>
                <h3 className="text-sm font-bold text-slate-900">Endpoints Backend NestJS — Webhook Manager</h3>
              </div>
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Contrats d'APIs REST NestJS dédiés à la distribution et à la validation des événements asynchrones :
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Lister les souscriptions Inbound / Outbound</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Enregistrer une souscription avec politique HMAC</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Détail configuration, secretRef et retry policy</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">PATCH</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Mettre à jour URL cible ou politique de retry</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks/:id/test</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Émettre un payload test avec signature simulée</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks/:id/deliveries</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Historique des livraisons, statuts HTTP et latences</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/webhooks/deliveries/:id/retry</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Rejeu manuel d'une livraison échouée</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-violet-50/90 border border-violet-200/90 rounded-2xl text-xs text-violet-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredWebhooks.length} webhook(s) trouvé(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Direction Filter Pills */}
      <div className="flex items-center gap-2">
        {['ALL', 'OUTBOUND', 'INBOUND'].map((dir) => (
          <button
            key={dir}
            onClick={() => setSelectedDirection(dir)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              selectedDirection === dir
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {dir === 'ALL' ? 'Toutes les directions' : dir === 'OUTBOUND' ? 'Sortants (Outbound)' : 'Entrants (Inbound)'}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Catalog, Right Selected Webhook & Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Webhooks List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredWebhooks.map((wh) => {
            const isSelected = wh.id === selectedWebhook?.id;
            return (
              <div
                key={wh.id}
                onClick={() => dispatch(setSelectedWebhookId(wh.id))}
                className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-violet-50/50 border-violet-300 ring-2 ring-violet-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          wh.direction === 'INBOUND'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-violet-50 text-violet-700 border border-violet-200'
                        }`}
                      >
                        {wh.direction}
                      </span>
                      <span className="font-bold text-xs text-slate-900 font-mono">{wh.event}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 truncate max-w-xs">
                      {wh.endpoint}
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {wh.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  <span>Sign: {wh.signaturePolicy}</span>
                  <span className="text-emerald-600 font-semibold">{wh.successRatePct}% succès</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed View & Deliveries History (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedWebhook && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-violet-700">{selectedWebhook.code}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        selectedWebhook.direction === 'INBOUND'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}
                    >
                      {selectedWebhook.direction}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 font-mono">{selectedWebhook.event}</h3>
                </div>

                <button
                  onClick={handleTestDispatch}
                  disabled={isDispatching}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-bounce' : ''}`} />
                  <span>{isDispatching ? 'Envoi en cours...' : 'Tester Livraison'}</span>
                </button>
              </div>

              {/* Security & Retry Specs (API-CDC-04 Section 2 & 6) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Politique Signature</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedWebhook.signaturePolicy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Retry Policy</span>
                  <span className="font-bold text-violet-700 mt-0.5 block">
                    {selectedWebhook.retryPolicy.maxAttempts}x ({selectedWebhook.retryPolicy.backoff})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Délai Timeout</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedWebhook.timeout} ms</span>
                </div>
              </div>

              {/* Endpoint & Secret Reference */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Cible Endpoint HTTPS</span>
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-800 break-all select-all">
                    {selectedWebhook.endpoint}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span className="text-amber-900 font-semibold">Référence Clé de Signature :</span>
                    <span className="font-bold text-amber-950">{selectedWebhook.secretRef}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded font-semibold">
                    Masqué 🔒
                  </span>
                </div>
              </div>

              {/* Deliveries History (API-CDC-04 Section 5) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-3">
                  Historique Récent des Livraisons ({deliveries.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs font-mono">
                  {deliveries.map((del) => (
                    <div key={del.deliveryId} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              del.status === 'SUCCEEDED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            HTTP {del.httpStatus}
                          </span>
                          <span className="font-bold text-slate-900">{del.deliveryId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{del.eventId}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Trace: {del.traceId} • Durée: {del.duration}ms
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-400 text-[11px] block">{del.timestamp}</span>
                        <span className="text-[10px] text-slate-500">Tentative #{del.attempt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <Webhook className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouveau Contrat Webhook</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Conforme au contrat API-CDC-04</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code Webhook *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="EX: WH-OUT-SHIPMENT"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Direction</label>
                  <select
                    value={newDirection}
                    onChange={(e) => setNewDirection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="OUTBOUND">OUTBOUND (Sortant)</option>
                    <option value="INBOUND">INBOUND (Entrant)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom de l'Événement *</label>
                <input
                  type="text"
                  required
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="EX: shipment.dispatched"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Endpoint HTTPS Cible *</label>
                <input
                  type="url"
                  required
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  placeholder="https://partner.com/webhook"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

               <div>
                 <label className="font-semibold text-slate-700 block mb-1">Référence Secrète Liée (KMS/Vault)</label>
                 <select
                   value={newSecretRef}
                   onChange={(e) => setNewSecretRef(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                 >
                   {credentials.map((cred) => (
                     <option key={cred.id} value={cred.id}>
                       {cred.code} ({cred.type})
                     </option>
                   ))}
                 </select>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="font-semibold text-slate-700 block mb-1">Politique de Signature</label>
                   <select
                     value={newSignaturePolicy}
                     onChange={(e) => setNewSignaturePolicy(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                   >
                     <option value="HMAC-SHA256">HMAC-SHA256</option>
                     <option value="STRIPE-SIGNATURE-V1">STRIPE-SIGNATURE-V1</option>
                   </select>
                 </div>
                 <div>
                   <label className="font-semibold text-slate-700 block mb-1">Timeout (ms)</label>
                   <input
                     type="number"
                     value={newTimeout}
                     onChange={(e) => setNewTimeout(Number(e.target.value))}
                     placeholder="5000"
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                 <div>
                   <label className="font-semibold text-slate-700 block mb-1">Max Attempts</label>
                   <input
                     type="number"
                     value={newRetryMaxAttempts}
                     onChange={(e) => setNewRetryMaxAttempts(Number(e.target.value))}
                     placeholder="5"
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                   />
                 </div>
                 <div>
                   <label className="font-semibold text-slate-700 block mb-1">Backoff</label>
                   <select
                     value={newRetryBackoff}
                     onChange={(e) => setNewRetryBackoff(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                   >
                     <option value="EXPONENTIAL">EXPONENTIAL</option>
                     <option value="LINEAR">LINEAR</option>
                   </select>
                 </div>
                 <div>
                   <label className="font-semibold text-slate-700 block mb-1">Initial Delay (ms)</label>
                   <input
                     type="number"
                     value={newRetryInitialDelayMs}
                     onChange={(e) => setNewRetryInitialDelayMs(Number(e.target.value))}
                     placeholder="1000"
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                   />
                 </div>
               </div>

               <div>
                 <label className="font-semibold text-slate-700 block mb-1">Filtres (JSON optionnel)</label>
                 <input
                   type="text"
                   value={newFilters}
                   onChange={(e) => setNewFilters(e.target.value)}
                   placeholder='ex: {"tenant":"tenant-retail-fr","priority":"HIGH"}'
                   className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                 />
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
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Créer le webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
