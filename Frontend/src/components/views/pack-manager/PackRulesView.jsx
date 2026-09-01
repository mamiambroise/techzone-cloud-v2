// PackRulesView.jsx — PM-CDC-07: Visual Composition Rule Engine & Deterministic Simulator
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Sliders,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ToggleLeft,
  ArrowRight,
  Code,
  ShieldCheck,
  Zap,
  Terminal,
} from 'lucide-react';
import StatusBadge from '../../StatusBadge';
import NewPackRuleModal from './NewPackRuleModal';

export default function PackRulesView() {
  const {
    packs,
    packVersions,
    selectedPackId,
    setSelectedPackId,
    selectedPackVersionId,
    setSelectedPackVersionId,
    scopedPackRules,
    scopedPackFeatures,
    scopedPackModules,
    togglePackRule,
    deletePackRule,
    simulatePackRules,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'simulator'
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [simulationContext, setSimulationContext] = useState({
    features: {},
    modules: {},
    env: 'production',
  });
  const [simulationResult, setSimulationResult] = useState(null);

  // Selected pack & version
  const activePack = packs.find((p) => p.id === selectedPackId) || packs[0];
  const packVersionList = packVersions.filter((v) => v.packId === activePack?.id);
  const activeVersion =
    packVersionList.find((v) => v.id === selectedPackVersionId) || packVersionList[0];

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId);
    const firstVer = packVersions.find((v) => v.packId === packId);
    if (firstVer) setSelectedPackVersionId(firstVer.id);
    setSimulationResult(null);
  };

  const handleToggleSimFeature = (featCode) => {
    setSimulationContext((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featCode]: !prev.features[featCode],
      },
    }));
  };

  const handleRunSimulation = () => {
    if (!activeVersion) return;
    const res = simulatePackRules({
      packVersionId: activeVersion.id,
      contextPayload: simulationContext,
    });
    setSimulationResult(res);
    showToast(`Simulation terminée : ${res.triggeredRules.length} règle(s) activée(s).`);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Header & Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  Moteur de Règles & Conditions (PM-CDC-07)
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                  Moteur Déterministe
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Règles de composition conditionnelle, contraintes d'intégrité et simulateur dry-run.
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
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-4 border-b sm:border-b-0 border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'text-purple-600 font-black sm:bg-purple-50 border-b-2 sm:border-b-0 border-purple-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Règles de Composition ({scopedPackRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2 sm:pb-1 sm:px-3 sm:py-1.5 sm:rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'text-purple-600 font-black sm:bg-purple-50 border-b-2 sm:border-b-0 border-purple-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simulateur Dry-Run</span>
          </button>
        </div>

        {activeTab === 'rules' && (
          <button
            onClick={() => setIsNewRuleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Règle</span>
          </button>
        )}
      </div>

      {/* 3. Content Display */}
      {activeTab === 'rules' ? (
        <div className="space-y-4">
          {scopedPackRules.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Sliders className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Aucune règle définie</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ajoutez des règles pour automatiser les dépendances conditionnelles et mutations de modules.
              </p>
              <button
                onClick={() => setIsNewRuleModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
              >
                Créer une Règle
              </button>
            </div>
          ) : (
            scopedPackRules.map((rule) => {
              const conditionPreds = rule.condition?.predicates || [];

              return (
                <div
                  key={rule.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                    rule.isActive
                      ? 'border-slate-200/80 hover:border-purple-300'
                      : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{rule.name}</h3>
                        <span className="font-mono text-[10px] text-slate-500">[{rule.code}]</span>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {rule.ruleType}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          Prio: {rule.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{rule.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePackRule(rule.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Désactivée'}
                      </button>

                      <button
                        onClick={() => deletePackRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Supprimer la règle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Logic Expression Representation */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs flex flex-wrap items-center gap-2">
                    <span className="font-bold text-purple-700">SI</span>
                    <span className="text-slate-600">
                      {conditionPreds
                        .map((p) => `${p.field} ${p.operator} '${p.value}'`)
                        .join(` ${rule.condition?.combinator || 'AND'} `)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-cyan-700">ALORS</span>
                    <span className="text-slate-800 font-semibold">
                      {rule.effect?.type} → {rule.effect?.target} ({rule.effect?.message})
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TAB 2: SIMULATEUR DRY-RUN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Context Inputs (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600" />
                Contexte d'Évaluation (Dry-Run)
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Activez des feature flags ou options pour tester en temps réel quelles règles se déclenchent.
            </p>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Features Toggles ({scopedPackFeatures.length})
              </span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scopedPackFeatures.map((feat) => {
                  const isChecked = Boolean(simulationContext.features[feat.code]);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => handleToggleSimFeature(feat.code)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">
                        <span>{feat.name}</span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {feat.code}
                        </span>
                      </div>
                      <div
                        className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                          isChecked ? 'bg-purple-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${
                            isChecked ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleRunSimulation}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Exécuter la Simulation</span>
              </button>
            </div>
          </div>

          {/* Right: Simulation Report (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Rapport d'Exécution & Mutations
              </h3>
            </div>

            {simulationResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Règles Déclenchées :</span>
                  <span className="font-mono font-black text-purple-700 text-sm">
                    {simulationResult.triggeredRules?.length || 0}
                  </span>
                </div>

                {/* Triggered Rules List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Effets Appliqués :
                  </span>
                  {simulationResult.appliedEffects?.length > 0 ? (
                    simulationResult.appliedEffects.map((eff, i) => (
                      <div
                        key={i}
                        className="p-3 bg-cyan-50/50 border border-cyan-200 rounded-xl flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold text-cyan-950">
                            {eff.type} → {eff.target}
                          </span>
                          <p className="text-slate-600 mt-0.5">{eff.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Aucun effet déclenché pour ce contexte.</p>
                  )}
                </div>

                {/* Conflicts if any */}
                {simulationResult.conflicts?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                      Conflits Bloquants Détectés :
                    </span>
                    {simulationResult.conflicts.map((conf, i) => (
                      <div
                        key={i}
                        className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>{conf.title}</strong>
                          <p className="mt-0.5">{conf.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
                <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  Configurez le contexte à gauche puis cliquez sur "Exécuter la Simulation".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal New Rule */}
      <NewPackRuleModal
        isOpen={isNewRuleModalOpen}
        onClose={() => setIsNewRuleModalOpen(false)}
        packVersionId={activeVersion?.id}
        packCode={activePack?.code || 'pack'}
      />
    </div>
  );
}
