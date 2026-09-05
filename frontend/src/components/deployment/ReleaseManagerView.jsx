import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../../store/platformSlice.js';
import {
  Package,
  Lock,
  CheckCircle2,
  FileCode2,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Layers,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function ReleaseManagerView() {
  const dispatch = useDispatch();
  const releases = useSelector((state) => state.deployment?.releases || []);
  const [selectedRelease, setSelectedRelease] = useState(releases[0] || null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReleases = releases.filter(
    (r) =>
      r.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    dispatch(
      addToast({
        type: 'info',
        title: 'Empreinte Copiée',
        message: 'Le condensat cryptographique SHA-256 a été copié.',
      })
    );
  };

  const handleSealNewRelease = () => {
    dispatch(
      addToast({
        type: 'success',
        title: 'Manifeste Scellé avec Succès',
        message: 'La release candidate v2.5.0-rc2 a été générée et signée cryptographiquement (SHA-256).',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-02
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                RELEASE & MANIFEST MANAGER
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestionnaire des Releases & Scellement de Manifeste
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Chaque release produit un manifeste canonique immuable signé par clé KMS. Les artéfacts, dépendances
              et schémas de configuration sont scellés avant toute promotion en environnement cible.
            </p>
          </div>

          <button
            onClick={handleSealNewRelease}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Sceller Nouvelle Release</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Releases List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher release, version ou app..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            {filteredReleases.map((rel) => {
              const isSelected = selectedRelease?.id === rel.id;
              return (
                <div
                  key={rel.id}
                  onClick={() => setSelectedRelease(rel)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-50/50 border-amber-500/80 shadow-xs ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">{rel.version}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        rel.status === 'ACTIVE_PROD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rel.status === 'IN_STAGING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rel.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700 mt-1">{rel.appName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{rel.code}</div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{rel.artifactsCount} artefacts ({rel.sizeMb} MB)</span>
                    </span>
                    <span className="font-mono text-amber-700 font-semibold">{rel.targetEnv}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Manifest Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRelease ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs font-mono uppercase text-slate-900">
                    Inspecteur de Manifeste Scellé
                  </span>
                </div>
                <button
                  onClick={() => handleCopyHash(selectedRelease.manifestHash)}
                  className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Hash Copié' : 'Copier Hash'}</span>
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div className="text-slate-500 text-[11px]">Version Cible</div>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {selectedRelease.version}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div className="text-slate-500 text-[11px]">Environnement</div>
                    <div className="font-mono font-bold text-amber-700 text-sm mt-0.5">
                      {selectedRelease.targetEnv}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div className="text-slate-500 text-[11px]">Stratégie Recommandée</div>
                    <div className="font-mono font-bold text-indigo-700 text-sm mt-0.5">
                      {selectedRelease.strategy}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-700 mb-1">Notes de Release :</div>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                    {selectedRelease.releaseNotes}
                  </p>
                </div>

                <div>
                  <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Empreinte Cryptographique SHA-256 :</span>
                    <span className="text-emerald-600 font-mono text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Signé par KMS
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-lg break-all">
                    {selectedRelease.manifestHash}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-700">Validations & Signatures :</div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-800">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{selectedRelease.approvedBy}</span>
                    </span>
                    <span className="font-mono text-[10px]">Scellé le {selectedRelease.sealedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Sélectionnez une release pour examiner son manifeste scellé.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
