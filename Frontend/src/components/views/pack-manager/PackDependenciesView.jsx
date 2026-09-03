// PackDependenciesView.jsx — PM-CDC-06: Pack Dependencies, Resolver & Visual DAG Graph
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  GitMerge,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Boxes,
  Network,
  ListFilter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../../StatusBadge';
import NewPackDependencyModal from './NewPackDependencyModal';

export default function PackDependenciesView() {
  const {
    packs,
    packVersions,
    selectedPackId,
    setSelectedPackId,
    selectedPackVersionId,
    setSelectedPackVersionId,
    scopedPackDependencies,
    packDependencies,
    deletePackDependency,
    resolvePackDependencies,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'graph'
  const [isNewDepModalOpen, setIsNewDepModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolverReport, setResolverReport] = useState(null);

  // Selected pack & version
  const activePack = packs.find((p) => p.id === selectedPackId) || packs[0];
  const packVersionList = packVersions.filter((v) => v.packId === activePack?.id);
  const activeVersion =
    packVersionList.find((v) => v.id === selectedPackVersionId) || packVersionList[0];

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId);
    const firstVer = packVersions.find((v) => v.packId === packId);
    if (firstVer) setSelectedPackVersionId(firstVer.id);
    setResolverReport(null);
  };

  const handleRunResolver = () => {
    if (!activeVersion) return;
    setIsResolving(true);
    try {
      const res = resolvePackDependencies(activeVersion.id);
      setResolverReport(res);
    } finally {
      setIsResolving(false);
    }
  };

  // KPIs
  const totalDeps = scopedPackDependencies.length;
  const resolvedCount = scopedPackDependencies.filter((d) => d.resolutionStatus === 'RESOLVED').length;
  const conflictCount = scopedPackDependencies.filter((d) => d.dependencyType === 'INCOMPATIBLE' || d.resolutionStatus === 'CONFLICT').length;
  const missingCount = scopedPackDependencies.filter((d) => d.dependencyType === 'REQUIRED' && d.resolutionStatus !== 'RESOLVED').length;

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Header & Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  Dependencies
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Vérification
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vérifiez les dépendances et les conflits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pack Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Pack :</span>
              <select
                value={activePack?.id || ''}
                onChange={(e) => handleSelectPack(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Version Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Version :</span>
              <select
                value={activeVersion?.id || ''}
                onChange={(e) => setSelectedPackVersionId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {packVersionList.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunResolver}
              disabled={isResolving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResolving ? 'animate-spin' : ''}`} />
              <span>Résoudre</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black">
            {totalDeps}
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500">Dépendances</span>
            <p className="text-xs font-extrabold text-slate-900">Total Déclarées</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
            {resolvedCount}
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600">Résolues</span>
            <p className="text-xs font-extrabold text-slate-900">100% Compatibles</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              missingCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {missingCount}
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-600">Manquantes</span>
            <p className="text-xs font-extrabold text-slate-900">Bloquantes</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
              conflictCount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {conflictCount}
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600">Incompatibilités</span>
            <p className="text-xs font-extrabold text-slate-900">Conflits Relevés</p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tabs & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-4 border-b sm:border-b-0 border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('table')}
            className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'table'
                ? 'text-indigo-600 font-black sm:bg-indigo-50 border-b-2 sm:border-b-0 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Matrice des Dépendances ({scopedPackDependencies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'graph'
                ? 'text-indigo-600 font-black sm:bg-indigo-50 border-b-2 sm:border-b-0 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Graphe Relationnel (DAG)</span>
          </button>
        </div>

        <button
          onClick={() => setIsNewDepModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Dépendance</span>
        </button>
      </div>

      {/* 4. Display Content */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pack Cible</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scopedPackDependencies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                      Aucune dépendance déclarée pour ce pack. Ce pack est totalement autonome.
                    </td>
                  </tr>
                ) : (
                  scopedPackDependencies.map((dep) => {
                    const isResolved = dep.resolutionStatus === 'RESOLVED';
                    const isConflict =
                      dep.dependencyType === 'INCOMPATIBLE' ||
                      dep.resolutionStatus === 'CONFLICT';

                    return (
                      <tr key={dep.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{dep.targetPackCode}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {dep.versionRange}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              dep.dependencyType === 'REQUIRED'
                                ? 'bg-indigo-100 text-indigo-800'
                                : dep.dependencyType === 'OPTIONAL'
                                ? 'bg-slate-100 text-slate-700'
                                : dep.dependencyType === 'EXTENDS'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {dep.dependencyType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isResolved ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Résolu</span>
                            </span>
                          ) : isConflict ? (
                            <span className="flex items-center gap-1 text-rose-700 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Conflit / Incompatible</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-700 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Non Résolu</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => window.confirm('Supprimer cette dépendance ?') && deletePackDependency(dep.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Supprimer la dépendance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Graph DAG */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-600" />
                Arborescence Topologique des Dépendances (DAG)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisation des liens directs et transitifs entre les packs du catalogue.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Requis & Résolu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Pack Actif
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Optionnel
              </span>
            </div>
          </div>

          {/* Central Active Node & Outgoing Dependencies */}
          <div className="flex flex-col items-center justify-center space-y-8 py-4">
            {/* Active Pack Node */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-700 text-white shadow-xl shadow-indigo-600/20 max-w-sm w-full text-center border-2 border-indigo-400/40">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white mb-2 inline-block">
                Pack Actif
              </span>
              <h4 className="text-base font-black">{activePack.name}</h4>
              <p className="font-mono text-xs text-indigo-200 mt-0.5">
                {activePack.code} (v{activeVersion?.versionNumber})
              </p>
            </div>

            {/* Outgoing Connectors */}
            {scopedPackDependencies.length > 0 ? (
              <div className="w-full">
                <div className="w-0.5 h-6 bg-slate-300 mx-auto" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {scopedPackDependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-2 hover:border-indigo-400 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {dep.targetPackCode}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            dep.dependencyType === 'REQUIRED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {dep.dependencyType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600">
                        <span>Range: <strong>{dep.versionRange}</strong></span>
                        <span className="text-cyan-700 font-mono font-bold">
                          {dep.resolvedVersion ? `v${dep.resolvedVersion}` : 'Non résolu'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune dépendance externe pour ce pack.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal New Dependency */}
      <NewPackDependencyModal
        isOpen={isNewDepModalOpen}
        onClose={() => setIsNewDepModalOpen(false)}
        sourcePackVersionId={activeVersion?.id}
        sourcePackCode={activePack?.code || 'pack'}
      />
    </div>
  );
}
