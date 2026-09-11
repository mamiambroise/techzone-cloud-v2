import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, addToast } from '../store/platformSlice.js';
import {
  RotateCw,
  Plus,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Boxes,
  Network,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export default function PackValidationCockpitView({ onOpenNewApp }) {
  const dispatch = useDispatch();
  const [activeAnomalyFilter, setActiveAnomalyFilter] = useState('ALL');
  const [resolvedDependency, setResolvedDependency] = useState(false);

  const handleResolve = () => {
    setResolvedDependency(true);
    dispatch(
      addToast({
        type: 'success',
        title: 'Dépendance résolue',
        message: 'Le catalogue a été mis à niveau vers catalog@2.0.1. Anomaly critique levée.',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb matching Screenshot 5 */}
      <nav className="flex items-center text-xs text-slate-500 font-medium overflow-x-auto py-1 whitespace-nowrap">
        <span>Business Manager</span>
        <span className="mx-1.5 text-slate-400">/</span>
        <span>Pack Manager</span>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="text-blue-600 font-semibold">Cockpit & Supervision (PM-CDC-01)</span>
      </nav>

      {/* Main Header matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Pack Manager Cockpit
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                PM-CDC-01 • COCKPIT DESIGN TIME
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                Tenant : Techzone Cloud Enterprise
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Supervision globale des packages modulaires, intégrité des dépendances, contrôle des
              règles de composition et génération des manifestes scellés.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto shrink-0">
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Cockpit actualisé',
                    message: 'Statistiques et arbres de dépendances synchronisés.',
                  })
                )
              }
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rafraîchir</span>
            </button>
            <button
              onClick={() => dispatch(setActiveTab('applications'))}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Registre des Packs
            </button>
            <button
              onClick={() => onOpenNewApp && onOpenNewApp()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Pack</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Metric Cards matching Screenshot 5 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Total Packs */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Packs
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">7</div>
          <p className="text-[11px] text-slate-500">6 actifs</p>
        </div>

        {/* Metric 2: Brouillons */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Brouillons
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">0</div>
          <p className="text-[11px] text-slate-500">En cours d'édition</p>
        </div>

        {/* Metric 3: Prêts (Ready) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Prêts (Ready)
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 font-mono">1</div>
          <p className="text-[11px] text-purple-600">Prêts à publier</p>
        </div>

        {/* Metric 4: Publiés */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Publiés
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">1</div>
          <p className="text-[11px] text-emerald-600">Scellés & immuables</p>
        </div>

        {/* Metric 5: Dépendances */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Dépendances
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 font-mono">
            {resolvedDependency ? '20/20' : '18/20'}
          </div>
          <p className="text-[11px] text-amber-600">
            {resolvedDependency ? 'Toutes résolues' : '1 manquante(s)'}
          </p>
        </div>

        {/* Metric 6: Santé Globale */}
        <div
          className={`rounded-xl border p-4 shadow-2xs space-y-1 ${
            resolvedDependency
              ? 'bg-emerald-50/50 border-emerald-300'
              : 'bg-rose-50/50 border-rose-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
            Santé Globale
          </span>
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono ${
              resolvedDependency ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {resolvedDependency ? '100%' : '65%'}
          </div>
          <p
            className={`text-[11px] font-semibold ${
              resolvedDependency ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {resolvedDependency ? 'OPTIMAL' : 'ANOMALIES CRITIQUES'}
          </p>
        </div>
      </div>

      {/* 4 Summary Cards matching Screenshot 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Summary Card 1: Moteur de Validation (PM-CDC-03) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Moteur de Validation (PM-CDC-03)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Valides</span>
                <span className="font-semibold text-emerald-600 font-mono">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invalides</span>
                <span className="font-semibold text-rose-600 font-mono">
                  {resolvedDependency ? '0' : '2'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Obsolètes</span>
                <span className="font-semibold text-amber-600 font-mono">1</span>
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Moteur de validation',
                  message: 'Règles de validation PM-CDC-03 exécutées sans rupture.',
                })
              )
            }
            className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Voir les validations <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Summary Card 2: Graphe de Dépendances (PM-CDC-06) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Graphe de Dépendances (PM-CDC-06)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Résolues avec succès</span>
                <span className="font-semibold text-emerald-600 font-mono">
                  {resolvedDependency ? '20' : '18'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manquantes / Conflits</span>
                <span className="font-semibold text-rose-600 font-mono">
                  {resolvedDependency ? '0' : '2'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cycles détectés</span>
                <span className="font-semibold text-slate-700 font-mono">0</span>
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Graphe de dépendances',
                  message: 'Arborescence DAG générée selon l\'algorithme de tri topologique.',
                })
              )
            }
            className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Matrice de dépendances <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Summary Card 3: Pack Manifests v1 (PM-CDC-00) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Pack Manifests v1 (PM-CDC-00)
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Manifests générés & scellés</span>
                <span className="font-semibold text-blue-600 font-mono">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Manifests obsolètes</span>
                <span className="font-semibold text-amber-600 font-mono">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Non générés (Draft)</span>
                <span className="font-semibold text-slate-700 font-mono">0</span>
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Pack Manifests scellés',
                  message: 'Les manifestes JSON-LD scellés contiennent les sommes SHA-256 certifiées.',
                })
              )
            }
            className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Inspecter les manifests <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Summary Card 4: Règles Conditionnelles (PM-CDC-07) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Règles Conditionnelles (PM-CDC-07)
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Règles d'activation</span>
                <span className="font-semibold text-purple-600 font-mono">18 actives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Simulateur déterministe</span>
                <span className="font-semibold text-emerald-600">Prêt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conflits</span>
                <span className="font-semibold text-slate-700 font-mono">0 détecté</span>
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Rule Builder',
                  message: 'Simulateur d\'évaluation des prédicats booléens actif.',
                })
              )
            }
            className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Ouvrir le Rule Builder <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Actions Requises & Anomalies (4) matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Actions Requises & Anomalies ({resolvedDependency ? '0' : '4'})
            </h2>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveAnomalyFilter('ALL')}
              className={`px-2.5 py-1 rounded-md ${
                activeAnomalyFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveAnomalyFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-md ${
                activeAnomalyFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              CRITICAL
            </button>
            <button
              onClick={() => setActiveAnomalyFilter('ERROR')}
              className={`px-2.5 py-1 rounded-md ${
                activeAnomalyFilter === 'ERROR'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              ERROR
            </button>
            <button
              onClick={() => setActiveAnomalyFilter('WARNING')}
              className={`px-2.5 py-1 rounded-md ${
                activeAnomalyFilter === 'WARNING'
                  ? 'bg-yellow-600 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              WARNING
            </button>
            <button
              onClick={() => setActiveAnomalyFilter('INFO')}
              className={`px-2.5 py-1 rounded-md ${
                activeAnomalyFilter === 'INFO'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              INFO
            </button>
          </div>
        </div>

        {resolvedDependency ? (
          <div className="p-6 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-emerald-900 text-sm">
              Toutes les anomalies ont été résolues avec succès
            </h3>
            <p className="text-xs text-emerald-700">
              Le graphe de dépendance est intègre. Les manifests scellés peuvent être promulgués en
              toute sécurité.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Critical Alert matching Screenshot 5 */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800 uppercase">
                      CRITIQUE
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      Dépendance obligatoire non résolue
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Analytics & Reporting • v1.1.0-draft [PM-CDC-06]
                    </span>
                  </div>
                  <p className="text-xs text-rose-800">
                    La dépendance requise vers 'catalog &gt;= 2.0.0' est introuvable ou
                    incompatible.
                  </p>
                </div>
              </div>

              <button
                onClick={handleResolve}
                className="self-start sm:self-auto shrink-0 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Résoudre dépendances</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
