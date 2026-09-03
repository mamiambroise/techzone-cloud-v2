// PackVersionsView.jsx — PM-CDC-03: Pack Versions, Validation Matrix & Sealed Manifests v1
import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Layers,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCode,
  Rocket,
  RotateCcw,
  Archive,
  Plus,
  Play,
  Copy,
  Download,
  Lock,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Hash,
} from 'lucide-react';
import StatusBadge from '../../StatusBadge';
import NewPackVersionModal from './NewPackVersionModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';

export default function PackVersionsView({ mode = 'versions' }) {
  const {
    packs,
    packVersions,
    selectedPackId,
    setSelectedPackId,
    selectedPackVersionId,
    setSelectedPackVersionId,
    validatePackVersion,
    generatePackManifestV1,
    publishPackVersion,
    rollbackPackVersion,
    deprecatePackVersion,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('validation'); // 'validation' | 'manifest' | 'pipeline'
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
  const [lastValidationReport, setLastValidationReport] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (mode === 'manifest') setActiveTab('manifest');
    else if (mode === 'publication') setActiveTab('pipeline');
    else if (mode === 'validation') setActiveTab('validation');
  }, [mode]);

  // Selected pack & version
  const activePack = packs.find((p) => p.id === selectedPackId) || packs[0];
  const packVersionList = packVersions.filter((v) => v.packId === activePack?.id);
  const activeVersion =
    packVersionList.find((v) => v.id === selectedPackVersionId) || packVersionList[0];

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId);
    const firstVer = packVersions.find((v) => v.packId === packId);
    if (firstVer) {
      setSelectedPackVersionId(firstVer.id);
    }
    setLastValidationReport(null);
    setManifestData(null);
  };

  const handleRunValidation = async () => {
    if (!activeVersion) return;
    setIsValidating(true);
    try {
      const res = await validatePackVersion(activeVersion.id);
      setLastValidationReport(res);
    } finally {
      setIsValidating(false);
    }
  };

  const handleGenerateManifest = async () => {
    if (!activeVersion) return;
    setIsGeneratingManifest(true);
    try {
      const res = await generatePackManifestV1(activeVersion.id);
      if (res.success) {
        setManifestData(res);
      }
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const handlePublish = async () => {
    if (!activeVersion) return;
    setIsPublishing(true);
    try {
      await publishPackVersion(activeVersion.id);
      setPublishConfirmationOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyManifest = () => {
    if (manifestData?.canonicalString) {
      navigator.clipboard.writeText(manifestData.canonicalString);
      showToast('Pack Manifest v1 copié dans le presse-papiers.');
    }
  };

  const handleDownloadManifest = () => {
    if (!manifestData?.manifest) return;
    const blob = new Blob([JSON.stringify(manifestData.manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pack-manifest-${activePack.code}-${activeVersion.versionNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Téléchargement du manifest v1 initié.');
  };

  if (!activePack) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Aucun pack configuré dans le système.</p>
      </div>
    );
  }

  const isVersionLocked =
    activeVersion?.status === 'PUBLISHED' || activeVersion?.status === 'DEPRECATED';

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Header & Pack Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  Versions
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 border border-cyan-300">
                  SemVer 2.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Construisez, validez et publiez les versions du pack sélectionné.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pack Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Pack :</span>
              <select
                value={activePack.id}
                onChange={(e) => handleSelectPack(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsNewVersionModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle version</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Version Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                Versions ({packVersionList.length})
              </h2>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {packVersionList.map((ver) => {
                const isSelected = ver.id === activeVersion?.id;
                const isPublished = ver.status === 'PUBLISHED';

                return (
                  <div
                    key={ver.id}
                    onClick={() => {
                      setSelectedPackVersionId(ver.id);
                      setLastValidationReport(null);
                      setManifestData(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            v{ver.versionNumber}
                          </span>
                          <StatusBadge status={ver.status} size="sm" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1 line-clamp-1">
                          {ver.label || ver.description}
                        </p>
                      </div>
                      {isPublished && (
                        <span className="p-1 rounded-md bg-emerald-100 text-emerald-700" title="Version de production active">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <span>Validation : <strong className={ver.validationStatus === 'VALID' ? 'text-emerald-600' : 'text-slate-600'}>{ver.validationStatus}</strong></span>
                      <span>•</span>
                      <span>Manifest : <strong className={ver.manifestStatus === 'VALID' ? 'text-cyan-600' : 'text-slate-600'}>{ver.manifestStatus}</strong></span>
                    </div>

                    {ver.manifestHash && (
                      <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-slate-400 truncate">
                        <Hash className="w-3 h-3 text-cyan-600 flex-shrink-0" />
                        <span className="truncate">{ver.manifestHash}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Version Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeVersion ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              {/* Version Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-black text-slate-900">
                      {activePack.name} — <span className="font-mono text-cyan-700">v{activeVersion.versionNumber}</span>
                    </h2>
                    <StatusBadge status={activeVersion.status} />
                    {isVersionLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                        <Lock className="w-3 h-3" /> Scellée
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeVersion.label} — {activeVersion.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunValidation}
                    disabled={isValidating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isValidating ? 'Validation...' : 'Tester Validité'}</span>
                  </button>
                  <button
                    onClick={handleGenerateManifest}
                    disabled={isGeneratingManifest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 font-bold text-xs transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{isGeneratingManifest ? 'Génération...' : 'Sceller Manifest'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('validation')}
                  className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'validation'
                      ? 'border-cyan-600 text-cyan-600 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matrice de Validation</span>
                </button>
                <button
                  onClick={() => setActiveTab('manifest')}
                  className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'manifest'
                      ? 'border-cyan-600 text-cyan-600 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>Pack Manifest v1 & Hash</span>
                </button>
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'pipeline'
                      ? 'border-cyan-600 text-cyan-600 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  <span>Cycle de Release & Publication</span>
                </button>
              </div>

              {/* TAB 1: VALIDATION MATRIX */}
              {activeTab === 'validation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        État de Conformité Actuel :{' '}
                        <span
                          className={`font-black ${
                            activeVersion.validationStatus === 'VALID'
                              ? 'text-emerald-600'
                              : activeVersion.validationStatus === 'INVALID'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {activeVersion.validationStatus}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Exécute les 5 piliers de vérification : SemVer, Modules Core, Graphe Dépendances, Capabilities et Moteur de Règles.
                      </p>
                    </div>
                    <button
                      onClick={handleRunValidation}
                      disabled={isValidating}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                    >
                      {isValidating ? 'Exécution du banc...' : 'Lancer la Validation Complète'}
                    </button>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2.5">
                    {lastValidationReport?.checks ? (
                      lastValidationReport.checks.map((chk) => (
                        <div
                          key={chk.id}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                            chk.passed
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          {chk.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{chk.title}</span>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  chk.passed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {chk.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1">{chk.details}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl">
                        <p className="text-xs text-slate-500">
                          Cliquez sur "Lancer la Validation Complète" pour auditer cette version.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PACK MANIFEST V1 & HASH */}
              {activeTab === 'manifest' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-bold">
                        SHA-256 :{' '}
                        {activeVersion.manifestHash ||
                          (manifestData?.manifestHash ? manifestData.manifestHash : 'Non scellé')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyManifest}
                        disabled={!manifestData?.canonicalString}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier JSON</span>
                      </button>
                      <button
                        onClick={handleDownloadManifest}
                        disabled={!manifestData?.manifest}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exporter .json</span>
                      </button>
                    </div>
                  </div>

                  {manifestData?.canonicalString ? (
                    <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 border border-slate-800">
                      {JSON.stringify(JSON.parse(manifestData.canonicalString), null, 2)}
                    </pre>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl space-y-3">
                      <FileCode className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600">
                        Le snapshot canonical JSON n'a pas encore été généré pour la session active.
                      </p>
                      <button
                        onClick={handleGenerateManifest}
                        disabled={isGeneratingManifest}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                      >
                        {isGeneratingManifest ? 'Génération...' : 'Compiler & Sceller le Manifest v1'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RELEASE PIPELINE */}
              {activeTab === 'pipeline' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-slate-50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-cyan-600" />
                      Actions du Cycle de Vie
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Gouvernance de mise en production. La publication verrouille définitivement la version et substitue les versions obsolètes.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeVersion.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => setPublishConfirmationOpen(true)}
                          disabled={isPublishing || activeVersion.validationStatus !== 'VALID'}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Rocket className="w-4 h-4" />
                          <span>Publier cette version en Production</span>
                        </button>
                      )}

                      {activeVersion.status === 'SUPERSEDED' && (
                        <button
                          onClick={() => rollbackPackVersion(activePack.id, activeVersion.id)}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Rollback vers cette version</span>
                        </button>
                      )}

                      {activeVersion.status !== 'DEPRECATED' && (
                        <button
                          onClick={() => deprecatePackVersion(activeVersion.id)}
                          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          <span>Marquer comme Dépréciée</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-xs">Veuillez sélectionner une version pour afficher les détails.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal New Version */}
      <NewPackVersionModal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        targetPackId={activePack.id}
      />
      <ConfirmDialog
        open={publishConfirmationOpen}
        title="Publier cette version ?"
        description={`La version ${activeVersion?.versionNumber || ''} sera scellée et exposée au Pack Runtime. Cette action modifie le cycle de vie persistant.`}
        confirmLabel="Publier en production"
        busy={isPublishing}
        onConfirm={handlePublish}
        onCancel={() => setPublishConfirmationOpen(false)}
      />
    </div>
  );
}
