// PackOverviewView.jsx — PM-CDC-01 Pack Manager Cockpit & Supervision Dashboard
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  Boxes,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Filter,
  Search,
  Plus,
  RefreshCw,
  GitBranch,
  FileCheck,
  FileCode,
  Sliders,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  Sparkles,
} from 'lucide-react';

export default function PackOverviewView({ onOpenNewPackModal }) {
  const {
    packs,
    packStats,
    selectedPack,
    setSelectedPackId,
    openPackWorkspace,
    setCurrentView,
    currentTenant,
    showToast,
    resetToSeed,
  } = useApp();

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchAttention, setSearchAttention] = useState('');

  // Filtered Attention items
  const filteredAttention = useMemo(() => {
    return (packStats.attentionItems || []).filter((item) => {
      const matchSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const matchSearch =
        !searchAttention.trim() ||
        item.title.toLowerCase().includes(searchAttention.toLowerCase()) ||
        item.packName.toLowerCase().includes(searchAttention.toLowerCase()) ||
        item.description.toLowerCase().includes(searchAttention.toLowerCase());
      return matchSeverity && matchSearch;
    });
  }, [packStats.attentionItems, severityFilter, searchAttention]);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> CRITIQUE
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> ERREUR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
            <AlertTriangle className="w-3 h-3 text-yellow-600" /> ATTENTION
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" /> INFO
          </span>
        );
    }
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'HEALTHY':
        return {
          label: 'SAIN • OPÉRATIONNEL',
          color: 'emerald',
          icon: CheckCircle2,
          border: 'border-emerald-200',
          bg: 'bg-emerald-50/70',
          text: 'text-emerald-700',
          subText: 'text-emerald-800',
        };
      case 'WARNING':
        return {
          label: 'ATTENTION REQUISE',
          color: 'amber',
          icon: AlertTriangle,
          border: 'border-amber-200',
          bg: 'bg-amber-50/70',
          text: 'text-amber-700',
          subText: 'text-amber-800',
        };
      case 'CRITICAL':
      default:
        return {
          label: 'ANOMALIES CRITIQUES',
          color: 'rose',
          icon: XCircle,
          border: 'border-rose-200',
          bg: 'bg-rose-50/80',
          text: 'text-rose-700',
          subText: 'text-rose-800',
        };
    }
  };

  const healthMeta = getHealthBadge(packStats.healthStatus);
  const HealthIcon = healthMeta.icon;

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Header & Context Banner (White Card Theme) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                PM-CDC-01 • Cockpit Design Time
              </span>
              <span className="text-xs text-slate-500">
                Tenant : <strong className="text-slate-800 font-semibold">{currentTenant.name}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              Pack Manager Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Supervision globale des packages modulaires, intégrité des dépendances, contrôle des règles de composition et génération des manifestes scellés.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                showToast('Synchronisation du référentiel Pack effectuée.', 'info');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 transition-colors shadow-2xs"
              title="Rafraîchir les métriques"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rafraîchir</span>
            </button>
            <button
              onClick={() => setCurrentView('packs')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Registre des Packs</span>
            </button>
            <button
              onClick={onOpenNewPackModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Pack</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (KPIs) in Clean White */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Total Packs */}
        <div
          onClick={() => setCurrentView('packs')}
          className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Packs</span>
            <Boxes className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{packStats.totalPacks}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-bold">{packStats.activePacks}</span> actifs
          </div>
        </div>

        {/* Draft Versions */}
        <div
          onClick={() => setCurrentView('pack-versions')}
          className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Brouillons</span>
            <Clock className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-700">{packStats.draftPacks}</div>
          <div className="text-[11px] text-slate-500 mt-1">En cours d édition</div>
        </div>

        {/* Ready for Release */}
        <div
          onClick={() => setCurrentView('pack-versions')}
          className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Prêts (Ready)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{packStats.readyPacks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Prêts à publier</div>
        </div>

        {/* Published */}
        <div
          onClick={() => setCurrentView('pack-versions')}
          className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-cyan-300 hover:shadow-xs transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Publiés</span>
            <FileCheck className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-cyan-700">{packStats.publishedPacks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Scellés & immuables</div>
        </div>

        {/* Dependencies Check */}
        <div
          onClick={() => setCurrentView('pack-dependencies')}
          className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Dépendances</span>
            <GitBranch className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{packStats.dependencySummary.resolved}/{packStats.dependencySummary.total}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-bold">
            {packStats.dependencySummary.missing} manquante(s)
          </div>
        </div>

        {/* Health Score */}
        <div className={`rounded-xl p-4 border ${healthMeta.border} ${healthMeta.bg} transition-all shadow-2xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Santé Globale</span>
            <HealthIcon className={`w-4 h-4 ${healthMeta.text}`} />
          </div>
          <div className={`text-2xl font-black ${healthMeta.text}`}>
            {packStats.healthScore}%
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 truncate ${healthMeta.subText}`}>
            {healthMeta.label}
          </div>
        </div>
      </div>

      {/* 3. Diagnostic Grid (4 Sub-Systems) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System 1: Validation Engine */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Moteur de Validation</h3>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              PM-CDC-03
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Valides (VALID)
              </span>
              <span className="font-bold text-emerald-700">{packStats.validationSummary.valid}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Invalides (INVALID)
              </span>
              <span className="font-bold text-rose-700">{packStats.validationSummary.invalid}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Obsolètes (OUTDATED)
              </span>
              <span className="font-bold text-amber-700">{packStats.validationSummary.outdated}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('pack-versions')}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-between"
          >
            <span>Voir les validations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* System 2: Dependency Resolver */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Graphe de Dépendances</h3>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              PM-CDC-06
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Résolues avec succès
              </span>
              <span className="font-bold text-emerald-700">{packStats.dependencySummary.resolved}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Manquantes / Conflits
              </span>
              <span className="font-bold text-rose-700">
                {packStats.dependencySummary.missing + packStats.dependencySummary.conflicts}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Cycles détectés
              </span>
              <span className="font-bold text-cyan-700">{packStats.dependencySummary.cycles}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('pack-dependencies')}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-between"
          >
            <span>Matrice de dépendances</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* System 3: Pack Manifest Pipeline */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-bold text-slate-900">Pack Manifests v1 🔒</h3>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              PM-CDC-00
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Manifests générés & scellés
              </span>
              <span className="font-bold text-emerald-700">{packStats.manifestSummary.valid}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Manifests obsolètes
              </span>
              <span className="font-bold text-amber-700">{packStats.manifestSummary.outdated}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Non générés (Draft)
              </span>
              <span className="font-bold text-slate-600">{packStats.manifestSummary.notGenerated}</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('pack-versions')}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center justify-between"
          >
            <span>Inspecter les manifests</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* System 4: Composition Rules */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900">Règles Conditionnelles</h3>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              PM-CDC-07
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Règles d activation
              </span>
              <span className="font-bold text-purple-700">18 actives</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Simulateur déterministe
              </span>
              <span className="font-bold text-blue-600">Prêt</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Conflits de règles
              </span>
              <span className="font-bold text-emerald-700">0 détecté</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('pack-rules')}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-between"
          >
            <span>Ouvrir le Rule Builder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Attention & Remediation Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Actions Requises & Anomalies
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredAttention.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Liste priorisée des blocages de dépendances, validations obsolètes et anomalies bloquantes.
              </p>
            </div>
          </div>

          {/* Filters for Attention List */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer anomalies..."
                value={searchAttention}
                onChange={(e) => setSearchAttention(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white w-40 sm:w-48"
              />
            </div>

            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
              {['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    severityFilter === sev
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev === 'ALL' ? 'Tous' : sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List of items */}
        {filteredAttention.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-800">Aucune anomalie détectée pour ce filtre.</p>
            <p className="text-slate-500 mt-0.5">Tous les packs et versions sont conformes aux contraintes d architecture.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAttention.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5">{getSeverityBadge(item.severity)}</div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 truncate">{item.title}</span>
                      <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.packName} • v{item.versionNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">[{item.source}]</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    <div className="text-[11px] text-slate-500 font-mono">Cible : {item.target}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setSelectedPackId(item.packId);
                      setCurrentView(item.actionRoute || 'packs');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                  >
                    <span>{item.actionLabel || 'Résoudre'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Split Section: Quick Pack Registry & Recent Pack Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Packs Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Boxes className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Registre des Packs récents</h3>
            </div>
            <button
              onClick={() => setCurrentView('packs')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Voir tout ({packs.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {packs.slice(0, 5).map((pack) => (
              <div
                key={pack.id}
                onClick={() => openPackWorkspace(pack.id)}
                className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 hover:border-blue-300 rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: pack.color || '#3B82F6' }}
                  >
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {pack.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {pack.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {pack.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-lg">{pack.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-800">
                      v{pack.publishedVersionNumber || pack.currentVersionNumber || '1.0.0'}
                    </div>
                    <div className="text-[10px] text-slate-500">{pack.modulesCount} modules • {pack.featuresCount} feat.</div>
                  </div>
                  <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Audit & Activity Feed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Activité Pack Manager</h3>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Audit Live
            </span>
          </div>

          <div className="space-y-3">
            {(packStats.recentActivities || []).slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="text-xs space-y-1 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-blue-600 font-semibold">{act.traceId}</span>
                  <span className="text-slate-400">
                    {new Date(act.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="font-semibold text-slate-800">
                  <span className="text-blue-700">[{act.packCode}]</span> {act.details}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Par {act.actor} ({act.role})</span>
                  <span className={`font-bold ${act.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Traçabilité ISO complète</span>
            <button
              onClick={() => setCurrentView('audit')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Journal d audit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
