// PackModulesView.jsx — PM-CDC-04 (Modules & Features) & PM-CDC-05 (Capabilities Registry)
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Package,
  ToggleLeft,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Code,
  Tag,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import StatusBadge from '../../StatusBadge';
import NewPackModuleModal from './NewPackModuleModal';
import NewPackFeatureModal from './NewPackFeatureModal';
import NewPackCapabilityModal from './NewPackCapabilityModal';

export default function PackModulesView() {
  const {
    packs,
    packVersions,
    selectedPackId,
    setSelectedPackId,
    selectedPackVersionId,
    setSelectedPackVersionId,
    scopedPackModules,
    scopedPackFeatures,
    scopedPackCapabilities,
    deletePackModule,
    togglePackFeature,
    deletePackFeature,
    deletePackCapability,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'capabilities'
  const [selectedModuleIdForFeature, setSelectedModuleIdForFeature] = useState(null);
  const [isNewModuleModalOpen, setIsNewModuleModalOpen] = useState(false);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);
  const [isNewCapabilityModalOpen, setIsNewCapabilityModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [capFilter, setCapFilter] = useState('ALL'); // 'ALL' | 'PROVIDES' | 'REQUIRES' | 'USES'

  // Selected pack & version
  const activePack = packs.find((p) => p.id === selectedPackId) || packs[0];
  const packVersionList = packVersions.filter((v) => v.packId === activePack?.id);
  const activeVersion =
    packVersionList.find((v) => v.id === selectedPackVersionId) || packVersionList[0];

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId);
    const firstVer = packVersions.find((v) => v.packId === packId);
    if (firstVer) setSelectedPackVersionId(firstVer.id);
  };

  const handleOpenAddFeature = (moduleId) => {
    setSelectedModuleIdForFeature(moduleId);
    setIsNewFeatureModalOpen(true);
  };

  const filteredModules = scopedPackModules.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCapabilities = scopedPackCapabilities.filter((c) => {
    const matchesFilter = capFilter === 'ALL' || c.relationType === capFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.capabilityCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Header & Version Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  Modules, Features & Capabilities (PM-CDC-04 & 05)
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                  Composition & Contrats
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Arborescence modulaire, feature flags et registre des interfaces techniques pour le pack.
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
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {packVersionList.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} ({v.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-4 border-b sm:border-b-0 border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('modules')}
              className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'modules'
                  ? 'text-cyan-600 font-black sm:bg-cyan-50 border-b-2 sm:border-b-0 border-cyan-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Modules & Features ({scopedPackModules.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('capabilities')}
              className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'capabilities'
                  ? 'text-purple-600 font-black sm:bg-purple-50 border-b-2 sm:border-b-0 border-purple-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Registre des Capabilities ({scopedPackCapabilities.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 w-40 sm:w-56"
              />
            </div>

            {activeTab === 'modules' ? (
              <button
                onClick={() => setIsNewModuleModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Module</span>
              </button>
            ) : (
              <button
                onClick={() => setIsNewCapabilityModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Déclarer Capability</span>
              </button>
            )}
          </div>
        </div>

        {/* Capability Filters */}
        {activeTab === 'capabilities' && (
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {['ALL', 'PROVIDES', 'REQUIRES', 'USES'].map((filter) => (
              <button
                key={filter}
                onClick={() => setCapFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  capFilter === filter
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL'
                  ? 'Toutes'
                  : filter === 'PROVIDES'
                  ? 'Fournies (PROVIDES)'
                  : filter === 'REQUIRES'
                  ? 'Requises (REQUIRES)'
                  : 'Optionnelles (USES)'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Content Display */}
      {activeTab === 'modules' ? (
        <div className="space-y-4">
          {filteredModules.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Aucun module déclaré</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Commencez par ajouter le premier module pour cette version du pack (ex: Module Core de base).
              </p>
              <button
                onClick={() => setIsNewModuleModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700"
              >
                Ajouter un Module
              </button>
            </div>
          ) : (
            filteredModules.map((module) => {
              const moduleFeatures = scopedPackFeatures.filter((f) => f.moduleId === module.id);
              const isCore = module.moduleType === 'CORE' || module.isRequired;

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:border-slate-300 transition-all"
                >
                  {/* Module Card Header */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                          module.moduleType === 'CORE'
                            ? 'bg-blue-600'
                            : module.moduleType === 'INTEGRATION'
                            ? 'bg-indigo-600'
                            : module.moduleType === 'EXTENSION'
                            ? 'bg-purple-600'
                            : 'bg-cyan-600'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">{module.name}</h3>
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            [{module.code}]
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              module.moduleType === 'CORE'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {module.moduleType}
                          </span>
                          {module.isRequired && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              OBLIGATOIRE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddFeature(module.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-cyan-500 hover:text-cyan-600 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter Feature</span>
                      </button>

                      {!isCore && (
                        <button
                          onClick={() => deletePackModule(module.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer le module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Module Features List */}
                  <div className="p-4 space-y-2">
                    {moduleFeatures.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Aucune fonctionnalité déclarée pour ce module.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {moduleFeatures.map((feat) => (
                          <div
                            key={feat.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              feat.enabled
                                ? 'bg-cyan-50/30 border-cyan-200'
                                : 'bg-slate-50 border-slate-200 opacity-75'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {feat.name}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400">
                                  {feat.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {feat.description || feat.featureType}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {feat.isRequired ? (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                  CORE
                                </span>
                              ) : (
                                <button
                                  onClick={() => togglePackFeature(feat.id)}
                                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    feat.enabled ? 'bg-cyan-600' : 'bg-slate-300'
                                  }`}
                                  title={feat.enabled ? 'Désactiver' : 'Activer'}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                      feat.enabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              )}

                              {!feat.isRequired && (
                                <button
                                  onClick={() => deletePackFeature(feat.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Capabilities Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Capability</th>
                  <th className="px-4 py-3">Code Unique</th>
                  <th className="px-4 py-3">Relation</th>
                  <th className="px-4 py-3">Stabilité</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCapabilities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                      Aucune capability déclarée pour ce pack.
                    </td>
                  </tr>
                ) : (
                  filteredCapabilities.map((cap) => (
                    <tr key={cap.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>{cap.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan-700">
                        {cap.capabilityCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            cap.relationType === 'PROVIDES'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cap.relationType === 'REQUIRES'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cap.relationType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold text-slate-600">
                          {cap.stability}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {cap.description}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deletePackCapability(cap.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer la capability"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPackModuleModal
        isOpen={isNewModuleModalOpen}
        onClose={() => setIsNewModuleModalOpen(false)}
        packVersionId={activeVersion?.id}
      />

      <NewPackFeatureModal
        isOpen={isNewFeatureModalOpen}
        onClose={() => {
          setIsNewFeatureModalOpen(false);
          setSelectedModuleIdForFeature(null);
        }}
        moduleId={selectedModuleIdForFeature}
        packVersionId={activeVersion?.id}
      />

      <NewPackCapabilityModal
        isOpen={isNewCapabilityModalOpen}
        onClose={() => setIsNewCapabilityModalOpen(false)}
        packVersionId={activeVersion?.id}
        packCode={activePack?.code || 'pack'}
      />
    </div>
  );
}
