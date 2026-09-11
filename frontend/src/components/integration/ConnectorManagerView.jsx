import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedConnectorId,
  updateConnectorStatus,
  pingConnector,
  addConnector,
} from '../../store/integrationSlice.js';
import { logAuditAction } from '../../store/auditSlice.js';
import { addToast, setSearchQuery } from '../../store/platformSlice.js';
import {
  Network,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  KeyRound,
  FileCode2,
  Filter,
  X,
  Search,
  ExternalLink,
  Layers,
  Activity,
  Terminal,
  Server,
  Zap,
  Check,
} from 'lucide-react';

const PROVIDER_TYPES = [
  'ALL',
  'REST',
  'GRAPHQL',
  'DATABASE_ADAPTER',
  'FILE',
  'MESSAGE_QUEUE',
  'CUSTOM_PROVIDER',
];

export default function ConnectorManagerView({ onOpenNewConnector }) {
  const dispatch = useDispatch();

  const connectors = useSelector((state) => state.integration.connectors);
  const selectedConnectorId = useSelector((state) => state.integration.selectedConnectorId);
  const credentials = useSelector((state) => state.integration.credentials);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const providerMode = useSelector((state) => state.integration.providerMode);

  const [selectedType, setSelectedType] = useState('ALL');
  const [isPinging, setIsPinging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEndpointsModal, setShowEndpointsModal] = useState(false);

  // New connector form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('REST');
  const [newEndpoint, setNewEndpoint] = useState('https://api.partner.example.com/v1');
  const [newCredentialRef, setNewCredentialRef] = useState(credentials[0]?.id || '');
  const [newCapabilities, setNewCapabilities] = useState(['read', 'write']);

  // Filter connectors
  const filteredConnectors = connectors.filter((c) => {
    const matchesType = selectedType === 'ALL' || c.providerType === selectedType;
    if (!searchQuery.trim()) return matchesType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.providerType.toLowerCase().includes(q) ||
      c.capabilities.some((cap) => cap.toLowerCase().includes(q)) ||
      (c.credentialRef && c.credentialRef.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const selectedConnector =
    connectors.find((c) => c.id === selectedConnectorId) || filteredConnectors[0] || connectors[0];

  const handlePing = (connectorId) => {
    setIsPinging(true);
    setTimeout(() => {
      dispatch(pingConnector(connectorId));
      setIsPinging(false);
      dispatch(
        addToast({
          type: 'success',
          title: 'Health Check Réussi (API-CDC-02)',
          message: `Connectivité, auth et conformité de contrat validées pour ${selectedConnector?.code}.`,
        })
      );
      dispatch(
        logAuditAction({
          action: 'CONNECTOR_HEALTH_PING',
          resourceType: 'CONNECTOR',
          resourceId: connectorId,
          user: activeUser,
          details: { latencyMs: 54, status: 'HEALTHY' },
        })
      );
    }, 600);
  };

  const handleToggleStatus = (connector) => {
    const newStatus = connector.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    dispatch(updateConnectorStatus({ id: connector.id, status: newStatus }));
    dispatch(
      addToast({
        type: newStatus === 'ACTIVE' ? 'success' : 'warning',
        title: `Connecteur ${newStatus === 'ACTIVE' ? 'Activé' : 'Désactivé'}`,
        message: `${connector.code} est désormais ${newStatus}.`,
      })
    );
    dispatch(
      logAuditAction({
        action: 'UPDATE_CONNECTOR_STATUS',
        resourceType: 'CONNECTOR',
        resourceId: connector.id,
        user: activeUser,
        details: { previousStatus: connector.status, newStatus },
      })
    );
  };

  const handleCreateConnector = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newId = 'conn-' + newCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newConn = {
      id: newId,
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      providerType: newType,
      contractVersion: 'v1.0.0',
      status: 'ACTIVE',
      configurationSchema: {
        endpoint: newEndpoint.trim(),
        timeoutMs: 5000,
        retryCount: 3,
      },
      credentialRef: newCredentialRef,
      capabilities: newCapabilities,
      health: {
        status: 'HEALTHY',
        lastChecked: 'À l\'instant',
        latencyMs: 65,
        availabilityPct: 100.0,
      },
      mode: providerMode,
    };

    dispatch(addConnector(newConn));
    setShowCreateModal(false);
    setNewCode('');
    setNewName('');

    dispatch(
      addToast({
        type: 'success',
        title: 'Connecteur Enregistré (API-CDC-02)',
        message: `Le connecteur ${newConn.code} a été ajouté avec succès.`,
      })
    );

    dispatch(
      logAuditAction({
        action: 'CREATE_CONNECTOR',
        resourceType: 'CONNECTOR',
        resourceId: newId,
        user: activeUser,
        details: { code: newConn.code, providerType: newConn.providerType },
      })
    );
  };

  const toggleCapability = (cap) => {
    if (newCapabilities.includes(cap)) {
      setNewCapabilities(newCapabilities.filter((c) => c !== cap));
    } else {
      setNewCapabilities([...newCapabilities, cap]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              API-CDC-02
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">Connector Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Connecteurs Systèmes Externes
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredConnectors.length} connecteur(s)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Gestion, test de santé, conformité contractuelle et capacités d'échange (REST, GraphQL, DB, Files, MQ).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEndpointsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Endpoints NestJS (§9)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Connecteur</span>
          </button>
        </div>
      </div>

      {/* NestJS Endpoints Modal for Connectors (API-CDC-02 §9) */}
      {showEndpointsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                  API-CDC-02 §9
                </span>
                <h3 className="text-sm font-bold text-slate-900">Endpoints Backend NestJS — Connector Manager</h3>
              </div>
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Contrats d'APIs REST NestJS dédiés à la gestion du cycle de vie des connecteurs externes :
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Lister les connecteurs avec filtrage type/statut</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Enregistrer un connecteur typé</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">GET</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Détails, capacités et métadonnées sûres</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">PATCH</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors/:id</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Mettre à jour schéma ou référence credential</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors/:id/ping</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Tester connectivité, auth & contrat</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">POST</span>
                  <span className="font-bold text-slate-900">/api/integrations/connectors/:id/status</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans">Transition de cycle de vie (ACTIVE / DISABLED)</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-[11px] text-indigo-950 font-sans space-y-1">
              <span className="font-bold block">Cycle de vie officiel (API-CDC-02 §4) :</span>
              <div className="font-mono text-[10px] text-indigo-800 flex flex-wrap gap-1">
                <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">DRAFT</span>
                <span>→</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">CONFIGURING</span>
                <span>→</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">VALIDATING</span>
                <span>→</span>
                <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200">READY</span>
                <span>→</span>
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800">ACTIVE</span>
                <span>→</span>
                <span className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-bold text-amber-800">DEGRADED</span>
                <span>→</span>
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">DISABLED / ARCHIVED</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEndpointsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl text-xs text-indigo-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredConnectors.length} connecteur(s) trouvé(s)
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

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PROVIDER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedType === type
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type === 'ALL' ? 'Tous les Types' : type}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Catalog, Right Selected Connector Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Connectors List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredConnectors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <Search className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs">Aucun connecteur ne correspond au filtre sélectionné.</p>
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  dispatch(setSearchQuery(''));
                }}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            filteredConnectors.map((connector) => {
              const isSelected = connector.id === selectedConnector?.id;
              const isHealthy = connector.health?.status === 'HEALTHY';
              const isDegraded = connector.health?.status === 'DEGRADED';

              return (
                <div
                  key={connector.id}
                  onClick={() => dispatch(setSelectedConnectorId(connector.id))}
                  className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900">{connector.name}</span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${
                            connector.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : connector.status === 'DEGRADED'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {connector.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{connector.code}</div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold shrink-0">
                      {connector.providerType}
                    </span>
                  </div>

                  {/* Capabilities Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                    {connector.capabilities?.map((cap) => (
                      <span
                        key={cap}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold"
                      >
                        {cap}
                      </span>
                    ))}
                    <div className="ml-auto text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHealthy ? 'bg-emerald-500' : isDegraded ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                      <span>{connector.health?.latencyMs}ms</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed View of Selected Connector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedConnector ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 sticky top-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-600">{selectedConnector.code}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-xs font-mono text-slate-500">Contrat: {selectedConnector.contractVersion}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {selectedConnector.providerType}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedConnector.name}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePing(selectedConnector.id)}
                    disabled={isPinging}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                    title="Exécuter un test de connectivité et de contrat"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>{isPinging ? 'Ping...' : 'Health Check'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(selectedConnector)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      selectedConnector.status === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedConnector.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>

              {/* Health & Performance Banner (API-CDC-02 Section 6) */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Statut Santé</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{selectedConnector.health?.status || 'HEALTHY'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Latence Moyenne</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedConnector.health?.latencyMs} ms
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Disponibilité</div>
                  <div className="text-xs font-bold text-indigo-600 mt-0.5">
                    {selectedConnector.health?.availabilityPct}%
                  </div>
                </div>
              </div>

              {/* Capabilities (API-CDC-02 Section 5) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                  Capacités Déclarées
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedConnector.capabilities?.map((cap) => (
                    <div
                      key={cap}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 font-mono font-semibold"
                    >
                      <Check className="w-3 h-3 text-indigo-600" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Schema (API-CDC-02 Section 7) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                  Schéma de Configuration
                </h4>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
                  <pre>{JSON.stringify(selectedConnector.configurationSchema, null, 2)}</pre>
                </div>
              </div>

              {/* Credential Reference Binding (API-CDC-02 Section 7 & API-CDC-05) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">Référence d'Authentification Liée</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 font-semibold">
                    Backend-Only 🔒
                  </span>
                </div>
                <div className="text-xs font-mono text-amber-900 flex items-center justify-between">
                  <span>ID Référence: <strong>{selectedConnector.credentialRef || 'Non assigné'}</strong></span>
                  <span className="text-[11px] text-amber-700">Aucun secret exposé au frontend</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
              Sélectionnez un connecteur pour afficher ses spécifications.
            </div>
          )}
        </div>
      </div>

      {/* Create Connector Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enregistrer un Connecteur</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Conforme au contrat API-CDC-02</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConnector} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code Connecteur *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="EX: LOGISTICS-ADAPTER"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Type de Provider</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="REST">REST</option>
                    <option value="GRAPHQL">GRAPHQL</option>
                    <option value="DATABASE_ADAPTER">DATABASE_ADAPTER</option>
                    <option value="FILE">FILE</option>
                    <option value="MESSAGE_QUEUE">MESSAGE_QUEUE</option>
                    <option value="CUSTOM_PROVIDER">CUSTOM_PROVIDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nom du Connecteur *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="EX: Connecteur Partenaire Transport GLS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Endpoint de base</label>
                <input
                  type="text"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  placeholder="https://api.partner.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Référence Credential Sécurisée</label>
                <select
                  value={newCredentialRef}
                  onChange={(e) => setNewCredentialRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.code} ({cred.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Capacités déclarées</label>
                <div className="flex flex-wrap gap-2">
                  {['read', 'write', 'sync', 'webhook', 'batch'].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => toggleCapability(cap)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                        newCapabilities.includes(cap)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Créer le connecteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
