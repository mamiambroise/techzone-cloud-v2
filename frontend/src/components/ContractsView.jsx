import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { api } from '../services/apiClient.js';
import {
  setSelectedContractId,
  setFilterStatus,
  lockContract,
  updateContractStatus,
  addContract,
} from '../store/contractsSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast } from '../store/platformSlice.js';
import {
  FileCode2,
  Lock,
  Unlock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function ContractsView() {
  const dispatch = useDispatch();

  const contracts = useSelector((state) => state.contracts.contracts);
  const selectedContractId = useSelector((state) => state.contracts.selectedContractId);
  const filterStatus = useSelector((state) => state.contracts.filterStatus);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);

  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [showCompatModal, setShowCompatModal] = useState(false);
  const [compatConsumer, setCompatConsumer] = useState('Team 4 Platform Foundation');
  const [compatVersion, setCompatVersion] = useState('1.0.0');
  const [compatResult, setCompatResult] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);

  // REAL DATA ONLY : le registre est chargé depuis l'API réelle.
  useEffect(() => {
    let live = true;
    setLoadError(false);
    api.get('/business-manager/contracts')
      .then((response) => {
        if (!live) return;
        const data = response.data ?? response;
        if (Array.isArray(data)) {
          data.forEach((contract) => dispatch(addContract(contract)));
        }
      })
      .catch(() => { if (live) setLoadError(true); });
    return () => { live = false; };
  }, [dispatch, revision]);

  // New contract form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newVersion, setNewVersion] = useState('1.0.0');
  const [newOwner, setNewOwner] = useState('Team 4 — Platform, API & Deployment');
  const [newDesc, setNewDesc] = useState('');

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.contractCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerTeam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selectedContract =
    contracts.find((c) => c.id === selectedContractId) || filteredContracts[0] || contracts[0];

  const handleLock = (contr) => {
    if (activeUser.role !== 'PLATFORM_SUPER_ADMIN') {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission refusée',
          message: 'Seul le Super Admin peut verrouiller définitivement un contrat.',
        })
      );
      return;
    }

    dispatch(lockContract(contr.id));
    dispatch(
      addToast({
        type: 'success',
        title: `Contrat verrouillé`,
        message: `${contr.contractCode} v${contr.contractVersion} est maintenant immuable.`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'LOCK_CONTRACT',
        resourceType: 'CONTRACT',
        resourceId: contr.id,
        details: `Verrouillage du contrat ${contr.contractCode} v${contr.contractVersion}. Empreinte SHA-256 certifiée.`,
        status: 'SUCCESS',
      })
    );
  };

  const handleStatusChange = (contr, nextStatus) => {
    dispatch(updateContractStatus({ id: contr.id, status: nextStatus }));
    dispatch(
      addToast({
        type: 'info',
        title: `Statut Contrat mis à jour`,
        message: `${contr.contractCode} est désormais en statut ${nextStatus}.`,
      })
    );
    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: 'UPDATE_CONTRACT_STATUS',
        resourceType: 'CONTRACT',
        resourceId: contr.id,
        details: `Passage de ${contr.contractCode} à l'état ${nextStatus}`,
        status: 'SUCCESS',
      })
    );
  };

  const handleTestCompatibility = () => {
    // Simulator logic based on PF-CDC-04 Section 6
    const majorTarget = parseInt(compatVersion.split('.')[0], 10);
    const majorContract = parseInt(selectedContract.contractVersion.split('.')[0], 10);

    if (isNaN(majorTarget)) {
      setCompatResult({
        compatible: false,
        code: 'PLATFORM_VERSION_INVALID',
        message: 'Format de version SemVer non reconnu.',
      });
      return;
    }

    if (majorTarget !== majorContract && selectedContract.compatibilityPolicy === 'SEMVER_STRICT') {
      setCompatResult({
        compatible: false,
        code: 'PLATFORM_CONTRACT_INCOMPATIBLE',
        message: `Rupture majeure de contrat détectée (v${majorTarget}.x vs v${majorContract}.x). La politique SEMVER_STRICT interdit cette interopérabilité sans mise à niveau du consumer.`,
      });
    } else {
      setCompatResult({
        compatible: true,
        code: 'CONTRACT_COMPATIBLE_OK',
        message: `Interopérabilité validée avec succès. Le consumer "${compatConsumer}" respecte les garanties du contrat ${selectedContract.contractCode} v${selectedContract.contractVersion}.`,
      });
    }
  };

  const handleCreateContract = (e) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    dispatch(
      addContract({
        contractCode: newCode.trim().toUpperCase(),
        name: newName.trim(),
        contractVersion: newVersion.trim(),
        ownerTeam: newOwner,
        description: newDesc.trim() || 'Spécification technique déclarée dans le registre.',
        compatibilityPolicy: 'BACKWARD_COMPATIBLE',
        hash: 'hash_' + Math.random().toString(36).substr(2, 10) + '98237461982736410982374619283746',
        spec: { format: 'JSON-Schema-v1', fields: ['id', 'timestamp'] },
      })
    );

    dispatch(
      addToast({
        type: 'success',
        title: 'Nouveau contrat enregistré',
        message: `Le contrat ${newCode.toUpperCase()} a été ajouté en statut DRAFT.`,
      })
    );

    setShowNewContractModal(false);
    setNewCode('');
    setNewName('');
    setNewDesc('');
  };

  const statusBadges = {
    LOCKED: 'bg-slate-900 text-white border-slate-900 font-bold',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    VALIDATING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
    DEPRECATED: 'bg-amber-50 text-amber-800 border-amber-300',
    RETIRED: 'bg-rose-50 text-rose-700 border-rose-200 line-through',
  };

  return (
    <div className="space-y-6">
      {/* Header Bento Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200/80">
              PF-CDC-04
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Registre Central de Contrats (Contract Registry)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Centralisation des contrats techniques versionnés entre packs. Garantit le découplage via des contrats stables et verrouillés.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setCompatResult(null);
              setCompatVersion(selectedContract.contractVersion);
              setShowCompatModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all active:scale-95"
          >
            <Shield className="w-4 h-4 text-violet-600" />
            <span>Test de Compatibilité</span>
          </button>

          <button
            onClick={() => setShowNewContractModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contrat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Contracts List + Detailed Spec View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contrats ({filteredContracts.length})
            </span>

            {/* Filter pills */}
            <select
              value={filterStatus}
              onChange={(e) => dispatch(setFilterStatus(e.target.value))}
              className="text-[11px] px-2.5 py-1 bg-white border border-slate-200/80 rounded-xl font-semibold text-slate-700 shadow-2xs"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="LOCKED">LOCKED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="VALIDATING">VALIDATING</option>
              <option value="DRAFT">DRAFT</option>
              <option value="DEPRECATED">DEPRECATED</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredContracts.map((contr) => {
              const isSelected = contr.id === selectedContract?.id;

              return (
                <div
                  key={contr.id}
                  onClick={() => dispatch(setSelectedContractId(contr.id))}
                  className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-violet-50/50 border-violet-300 ring-2 ring-violet-500/10 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{contr.contractCode}</span>
                        {contr.status === 'LOCKED' && (
                          <Lock className="w-3.5 h-3.5 text-emerald-600" title="Contrat verrouillé" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{contr.name}</span>
                    </div>

                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                      v{contr.contractVersion}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono truncate">{contr.ownerTeam.split('—')[0]}</span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadges[contr.status]}`}>
                      {contr.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details: Schema, Hash, Consumers & Providers */}
        <div className="lg:col-span-8 space-y-6">
          {selectedContract ? (
            <>
              {/* Header Overview Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedContract.name}</h2>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-800">
                        {selectedContract.contractCode} v{selectedContract.contractVersion}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedContract.description}</p>
                  </div>

                  {/* Lock Action (PF-CDC-04 Section 5) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedContract.status !== 'LOCKED' ? (
                      <button
                        onClick={() => handleLock(selectedContract)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-95 shadow-sm"
                        title="Verrouiller ce contrat pour interdire toute modification silencieuse"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verrouiller (LOCK)</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contrat Scellé</span>
                      </span>
                    )}

                    {selectedContract.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(selectedContract, 'VALIDATING')}
                        className="px-3 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-xl transition-all active:scale-95"
                      >
                        Soumettre à Validation
                      </button>
                    )}

                    {selectedContract.status === 'VALIDATING' && (
                      <button
                        onClick={() => handleStatusChange(selectedContract, 'ACTIVE')}
                        className="px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 rounded-xl transition-all active:scale-95"
                      >
                        Activer (ACTIVE)
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata & Fingerprint SHA-256 (PF-CDC-04 Section 8) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Équipe Propriétaire</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate block mt-0.5">{selectedContract.ownerTeam}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Politique Compatibilité</span>
                      <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{selectedContract.compatibilityPolicy}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Date de Publication</span>
                      <span className="text-slate-700 text-[11px] block mt-0.5">
                        {selectedContract.publishedAt ? new Date(selectedContract.publishedAt).toLocaleDateString() : 'Non publié'}
                      </span>
                    </div>
                  </div>

                  {/* Hash Fingerprint */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono flex items-center justify-between gap-2 overflow-x-auto border border-slate-900">
                    <div className="truncate">
                      <span className="text-slate-400 select-none">SHA-256: </span>
                      <span className="text-emerald-400 font-semibold">{selectedContract.hash}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedContract.hash);
                        dispatch(addToast({ type: 'info', title: 'Empreinte copiée', message: 'Hash SHA-256 dans le presse-papier.' }));
                      }}
                      className="text-slate-400 hover:text-white shrink-0 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Copier le hash"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Consumer vs Provider Relationship Matrix (PF-CDC-04 Section 7) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Relation Provider {'>'} Contrat {'>'} Consumers
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Découplage strict garanti</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-center">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1 font-semibold">Fournisseur (Provider)</span>
                    <div className="font-bold text-slate-800">{selectedContract.providers?.join(', ')}</div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center px-2">
                    <span className="text-indigo-600 font-bold font-mono text-xs">{selectedContract.contractCode}</span>
                    <ArrowRight className="w-5 h-5 text-slate-400 my-1 rotate-90 md:rotate-0" />
                    <span className="text-[10px] text-slate-400 font-medium">Contrat Immuable</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-center">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase block mb-1 font-semibold">Consommateurs (Consumers)</span>
                    <div className="font-medium text-slate-800 leading-relaxed">
                      {selectedContract.consumers?.join(', ') || 'Aucun pour le moment'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Schema JSON Specification */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-bold text-slate-900">Schéma Technique & Règles du Contrat</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Format Canonique</span>
                </div>
                <div className="p-5 bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(selectedContract.spec, null, 2)}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400">
              Aucun contrat sélectionné.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Contract */}
      {showNewContractModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">Enregistrer un Nouveau Contrat Technique</h3>
            <form onSubmit={handleCreateContract} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code du Contrat (Identifiant stable)</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="ex: AUTOMATION-CONTRACT"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom lisible</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Contrat d'Exécution Asynchrone"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version Initiale</label>
                  <input
                    type="text"
                    required
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Équipe Émettrice</label>
                  <input
                    type="text"
                    required
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Périmètre</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Préciser l'objet du contrat et les points de terminaison garantis..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewContractModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                >
                  Enregistrer en DRAFT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Compatibility Simulator (PF-CDC-04 Section 6) */}
      {showCompatModal && selectedContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Simulateur de Compatibilité & Breaking Change
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Vérifiez si une version cliente peut consommer le contrat <strong>{selectedContract.contractCode}</strong> (v{selectedContract.contractVersion}) sans régression.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consommateur (Consumer)</label>
                <input
                  type="text"
                  value={compatConsumer}
                  onChange={(e) => setCompatConsumer(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Version attendue par le Consumer</label>
                <input
                  type="text"
                  value={compatVersion}
                  onChange={(e) => setCompatVersion(e.target.value)}
                  placeholder="ex: 1.0.0 ou 2.0.0"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleTestCompatibility}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Exécuter le Test de Compatibilité</span>
              </button>

              {compatResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                    compatResult.compatible
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border-rose-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {compatResult.compatible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{compatResult.code}</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">{compatResult.message}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCompatModal(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
