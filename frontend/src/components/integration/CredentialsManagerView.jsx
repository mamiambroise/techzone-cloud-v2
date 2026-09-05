import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  rotateCredential,
  addCredentialReference,
  disableCredential,
} from '../../store/integrationSlice.js';
import { logAuditAction } from '../../store/auditSlice.js';
import { addToast, setSearchQuery } from '../../store/platformSlice.js';
import {
  KeyRound,
  ShieldCheck,
  Plus,
  RefreshCw,
  Lock,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
  Search,
  Server,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export default function CredentialsManagerView() {
  const dispatch = useDispatch();

  const credentials = useSelector((state) => state.integration.credentials);
  const connectors = useSelector((state) => state.integration.connectors);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const activeUser = useSelector((state) => state.platform.activeUser);

  const [selectedCred, setSelectedCred] = useState(credentials[0] || null);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // New credential reference state
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('API_KEY');
  const [newProvider, setNewProvider] = useState('VAULT_KMS');
  const [newConnectorId, setNewConnectorId] = useState(connectors[0]?.id || '');
  const [newKeyPrefix, setNewKeyPrefix] = useState('ak_live_');

  // Filter credentials
  const filteredCredentials = credentials.filter((cred) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cred.code.toLowerCase().includes(q) ||
      cred.type.toLowerCase().includes(q) ||
      cred.provider.toLowerCase().includes(q)
    );
  });

  const handleRotate = () => {
    if (!selectedCred) return;
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
      dispatch(rotateCredential({ id: selectedCred.id }));
      setShowRotateModal(false);

      dispatch(
        addToast({
          type: 'success',
          title: 'Rotation des Clés Effectuée (API-CDC-05)',
          message: `La référence ${selectedCred.code} a été régénérée dans ${selectedCred.provider} avec audit trail.`,
        })
      );

      dispatch(
        logAuditAction({
          action: 'ROTATE_INTEGRATION_REDENTIAL',
          resourceType: 'CREDENTIAL_REFERENCE',
          resourceId: selectedCred.id,
          user: activeUser,
          details: {
            code: selectedCred.code,
            provider: selectedCred.provider,
            lastRotatedAt: new Date().toISOString(),
          },
        })
      );
    }, 700);
  };

  const handleDisableCredential = () => {
    if (!selectedCred) return;
    dispatch(disableCredential({ id: selectedCred.id }));
    setShowDisableModal(false);

    dispatch(
      addToast({
        type: 'warning',
        title: 'Référence Révoquée (API-CDC-05)',
        message: `La référence ${selectedCred.code} a été révoquée et n'est plus utilisable.`,
      })
    );

    dispatch(
      logAuditAction({
        action: 'DISABLE_CREDENTIAL_REFERENCE',
        resourceType: 'CREDENTIAL_REFERENCE',
        resourceId: selectedCred.id,
        user: activeUser,
        details: { code: selectedCred.code, type: selectedCred.type, provider: selectedCred.provider },
      })
    );
  };

  const handleCreateCredential = (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const newId = 'cred-ref-' + newCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCred = {
      id: newId,
      code: newCode.toUpperCase().trim(),
      type: newType,
      provider: newProvider,
      status: 'ACTIVE',
      associatedConnector: newConnectorId,
      lastRotatedAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      metadataSafe: {
        keyPrefix: newKeyPrefix,
        maskedSecret: `${newKeyPrefix}•••••••••••• (Masqué)`,
        vaultKeyId: `vault/kv/integrations/${newCode.toLowerCase()}`,
      },
    };

    dispatch(addCredentialReference(newCred));
    dispatch(
      logAuditAction({
        action: 'CREATE_CREDENTIAL_REFERENCE',
        resourceType: 'CREDENTIAL_REFERENCE',
        resourceId: newId,
        user: activeUser,
        details: { code: newCred.code, type: newCred.type, provider: newCred.provider },
      })
    );
    setShowCreateModal(false);
    setNewCode('');
    setSelectedCred(newCred);

    dispatch(
      addToast({
        type: 'success',
        title: 'Référence de Secret Enregistrée (API-CDC-05)',
        message: `Référence ${newCred.code} ajoutée en toute sécurité sans divulgation de secret.`,
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              API-CDC-05
            </span>
            <span className="text-xs text-slate-400 font-mono">•</span>
            <span className="text-xs text-slate-500 font-medium">Credentials & Secrets Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestion Sécurisée des Références d'Authentification
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              {filteredCredentials.length} référence(s)
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Principe absolu NO-GO : Seules les références sont manipulées au frontend. Les secrets réels sont stockés exclusivement côté backend (Vault/KMS).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => activeUser.canWriteProd && setShowCreateModal(true)}
            disabled={!activeUser.canWriteProd}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              activeUser.canWriteProd
                ? 'bg-amber-800 hover:bg-amber-900 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Référence</span>
          </button>
        </div>
      </div>

      {/* Security NO-GO Mandates Banner (API-CDC-05 Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-950 font-mono">0% Secret Frontend</div>
            <div className="text-[11px] text-emerald-700">Aucune clé réelle exposée</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-950 font-mono">Logs 100% Redacted</div>
            <div className="text-[11px] text-emerald-700">Masquage automatique strict</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-950 font-mono">Isolation Tenant</div>
            <div className="text-[11px] text-emerald-700">Accès cross-tenant bloqué</div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-950 font-mono">Rotations Auditées</div>
            <div className="text-[11px] text-emerald-700">Traçabilité complète IAM</div>
          </div>
        </div>
      </div>

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredCredentials.length} référence(s) trouvée(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left Credential List, Right Selected Credential Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Credentials List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCredentials.map((cred) => {
            const isSelected = cred.id === selectedCred?.id;
            return (
              <div
                key={cred.id}
                onClick={() => setSelectedCred(cred)}
                className={`p-4 rounded-3xl border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 font-mono">{cred.code}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        {cred.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Provider: {cred.provider}
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {cred.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                  <span>Rotée: {cred.lastRotatedAt}</span>
                  <span>Exp: {cred.expiresAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Credential Detail & Rotation (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCred && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-amber-800">{selectedCred.code}</span>
                    <span className="text-xs text-slate-400 font-mono">•</span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedCred.provider}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 font-mono">{selectedCred.type}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => activeUser.canWriteProd && setShowDisableModal(true)}
                    disabled={!activeUser.canWriteProd}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      activeUser.canWriteProd
                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Révoquer</span>
                  </button>
                  <button
                    onClick={() => activeUser.canWriteProd && setShowRotateModal(true)}
                    disabled={!activeUser.canWriteProd}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                      activeUser.canWriteProd
                        ? 'bg-amber-800 hover:bg-amber-900 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rotation du Secret</span>
                  </button>
                </div>
              </div>

              {/* Lifecycle & Dates */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dernière Rotation</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedCred.lastRotatedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date d'Expiration</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedCred.expiresAt}</span>
                </div>
              </div>

              {/* Masked Safe Metadata (API-CDC-05 Section 4 & 6) */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Valeur Masquée Sécurisée</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Redaction backend automatique</span>
                  </span>
                </div>
                <div className="p-3.5 bg-slate-900 text-amber-400 rounded-2xl font-mono text-xs flex items-center justify-between shadow-inner">
                  <span>{selectedCred.metadataSafe?.maskedSecret || '••••••••••••••••••••••••'}</span>
                  <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    PROTECTED
                  </span>
                </div>
              </div>

              {/* Safe Metadata Details */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                  Métadonnées Techniques Sûres
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono text-xs overflow-x-auto text-slate-700">
                  <pre>{JSON.stringify(selectedCred.metadataSafe, null, 2)}</pre>
                </div>
              </div>

              {/* Associated Connector Link */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Connecteur lié :</span>
                <span className="font-bold text-slate-800">{selectedCred.associatedConnector || 'Non lié'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rotate Credential Modal */}
      {showRotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rotation Immédiate du Secret</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedCred?.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Une nouvelle clé sera générée au sein du coffre-fort{' '}
              <strong>{selectedCred?.provider}</strong>. L'ancienne clé restera active pendant une période de grâce de 24h avant révocation définitive.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono">
              Action auditée sous l'identité : <strong>{activeUser.name} ({activeUser.role})</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleRotate}
                disabled={isRotating}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>{isRotating ? 'Rotation en cours...' : 'Confirmer la rotation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Credential Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Révoquer la Référence</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedCred?.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cette action révoquera définitivement la référence{' '}
              <strong>{selectedCred?.code}</strong>. Toute utilisation ultérieure sera rejetée par le backend.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-mono">
              Action auditée sous l'identité : <strong>{activeUser.name} ({activeUser.role})</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisableModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDisableCredential}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirmer la révocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Credential Reference Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Enregistrer une Référence Secret</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Conforme au contrat API-CDC-05</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code Référence *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="EX: CRED-PARTNER-API"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Type de Secret</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="API_KEY">API_KEY</option>
                    <option value="BASIC_AUTH">BASIC_AUTH</option>
                    <option value="BEARER_TOKEN">BEARER_TOKEN</option>
                    <option value="OAUTH_CLIENT">OAUTH_CLIENT</option>
                    <option value="CERTIFICATE_REFERENCE">CERTIFICATE_REFERENCE</option>
                    <option value="CUSTOM_SECRET_REFERENCE">CUSTOM_SECRET_REFERENCE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Provider Sécurisé</label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="VAULT_KMS">VAULT_KMS</option>
                    <option value="AWS_SECRETS_MANAGER">AWS_SECRETS_MANAGER</option>
                    <option value="GCP_SECRET_MANAGER">GCP_SECRET_MANAGER</option>
                    <option value="HASHICORP_VAULT_PKI">HASHICORP_VAULT_PKI</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Préfixe de Clé</label>
                  <input
                    type="text"
                    value={newKeyPrefix}
                    onChange={(e) => setNewKeyPrefix(e.target.value)}
                    placeholder="ak_live_"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Connecteur Associé</label>
                <select
                  value={newConnectorId}
                  onChange={(e) => setNewConnectorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {connectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Créer la référence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
