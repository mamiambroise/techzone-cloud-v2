import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  switchBlueGreenSlot,
  setCanaryTrafficWeight,
  triggerNewDeployment,
} from '../../store/deploymentSlice.js';
import { addToast } from '../../store/platformSlice.js';
import {
  GitBranch,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Server,
  Layers,
  ShieldCheck,
  Activity,
  ArrowRight,
} from 'lucide-react';

export default function PipelinesManagerView() {
  const dispatch = useDispatch();
  const activeBlueGreenSlot = useSelector((state) => state.deployment?.activeBlueGreenSlot || 'BLUE');
  const canaryTrafficWeight = useSelector((state) => state.deployment?.canaryTrafficWeight || 20);
  const releases = useSelector((state) => state.deployment?.releases || []);

  const [selectedStrategy, setSelectedStrategy] = useState('BLUE_GREEN');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { name: '1. Validation Manifeste & SHA-256', duration: '1.2s' },
    { name: '2. Pre-flight Check & Quotas Infra', duration: '2.8s' },
    { name: '3. Provisioning Répliques Isolées', duration: '4.5s' },
    { name: '4. Health Probes & Readiness Test', duration: '3.1s' },
    { name: '5. Bascule de Trafic 0-Downtime', duration: '0.8s' },
    { name: '6. Enregistrement Snapshot PF-06', duration: '1.4s' },
    { name: '7. Télémétrie & Audit Nonce', duration: '0.6s' },
  ];

  const handleRunPipelineSimulation = () => {
    setPipelineRunning(true);
    setCurrentStepIndex(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setPipelineRunning(false);
        dispatch(
          triggerNewDeployment({
            releaseId: 'rel-01',
            targetEnv: 'PRODUCTION',
            strategy: selectedStrategy,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Pipeline Exécuté avec Succès',
            message: `Déploiement achevé selon la stratégie ${selectedStrategy}. 0 interruption de trafic.`,
          })
        );
      }
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-03
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                PIPELINES & STRATÉGIES DE DÉPLOIEMENT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pipelines d'Exécution & Déploiement Sans Coupure
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Configuration des stratégies de déploiement à zéro temps d’arrêt (Blue/Green, Canary progressif, Rolling).
              Orchestration automatique des sondes de santé et des bascules de charge.
            </p>
          </div>

          <button
            onClick={handleRunPipelineSimulation}
            disabled={pipelineRunning}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer ${
              pipelineRunning
                ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {pipelineRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Exécution Pipeline en cours...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Lancer Simulation Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Strategy Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Blue / Green */}
        <div
          onClick={() => setSelectedStrategy('BLUE_GREEN')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedStrategy === 'BLUE_GREEN'
              ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-700 uppercase">Stratégie 1</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedStrategy === 'BLUE_GREEN' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-2">Blue / Green Switch</h3>
          <p className="text-xs text-slate-500 mt-1">
            Deux environnements identiques. Le cluster standby est validé puis le trafic est commuté instantanément à 100%.
          </p>
          <div className="mt-3 text-[11px] font-mono text-indigo-600 font-semibold">
            Actif en Production (Slot {activeBlueGreenSlot})
          </div>
        </div>

        {/* Canary */}
        <div
          onClick={() => setSelectedStrategy('CANARY')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedStrategy === 'CANARY'
              ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-700 uppercase">Stratégie 2</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedStrategy === 'CANARY' ? 'bg-amber-600' : 'bg-slate-300'
              }`}
            />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-2">Canary Release</h3>
          <p className="text-xs text-slate-500 mt-1">
            Ventilation progressive du trafic (5% → 20% → 100%) vers la nouvelle version avec seuils d’erreurs automatiques.
          </p>
          <div className="mt-3 text-[11px] font-mono text-amber-600 font-semibold">
            Actif en Staging ({canaryTrafficWeight}% trafic)
          </div>
        </div>

        {/* Rolling */}
        <div
          onClick={() => setSelectedStrategy('ROLLING')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            selectedStrategy === 'ROLLING'
              ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-blue-700 uppercase">Stratégie 3</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedStrategy === 'ROLLING' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-2">Rolling Update</h3>
          <p className="text-xs text-slate-500 mt-1">
            Remplacement incrémental réplique par réplique assurant la capacité continue du cluster.
          </p>
          <div className="mt-3 text-[11px] font-mono text-blue-600 font-semibold">
            Standard DEV & TEST
          </div>
        </div>
      </div>

      {/* Interactive Controls for Chosen Strategy */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {selectedStrategy === 'BLUE_GREEN' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Contrôleur Blue/Green en Temps Réel</h4>
                <p className="text-xs text-slate-500">
                  Le commutateur de charge redirige immédiatement le trafic réseau vers le cluster passif.
                </p>
              </div>
              <button
                onClick={() => dispatch(switchBlueGreenSlot())}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Basculer vers {activeBlueGreenSlot === 'BLUE' ? 'GREEN' : 'BLUE'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div
                className={`p-4 rounded-xl border text-center transition-all ${
                  activeBlueGreenSlot === 'BLUE'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <div className="text-xs font-mono uppercase font-bold">Slot Blue (Primaire)</div>
                <div className="text-xl font-bold mt-1">
                  {activeBlueGreenSlot === 'BLUE' ? '100% EN LIGNE' : 'STANDBY PRÊT'}
                </div>
                <div className="text-[11px] font-mono mt-1 opacity-80">v2.4.0 • 8 répliques saines</div>
              </div>

              <div
                className={`p-4 rounded-xl border text-center transition-all ${
                  activeBlueGreenSlot === 'GREEN'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <div className="text-xs font-mono uppercase font-bold">Slot Green (Secondaire)</div>
                <div className="text-xl font-bold mt-1">
                  {activeBlueGreenSlot === 'GREEN' ? '100% EN LIGNE' : 'STANDBY PRÊT'}
                </div>
                <div className="text-[11px] font-mono mt-1 opacity-80">v2.5.0-rc1 • 8 répliques saines</div>
              </div>
            </div>
          </div>
        )}

        {selectedStrategy === 'CANARY' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Régulateur de Trafic Canary</h4>
                <span className="font-mono text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {canaryTrafficWeight}% vers Version Canary
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ajustez le curseur pour ventiler la charge entre la version stable (v2.4.0) et la version canary (v2.5.0-rc1).
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={canaryTrafficWeight}
                onChange={(e) => dispatch(setCanaryTrafficWeight(Number(e.target.value)))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0% (Standby)</span>
                <span>20% (Test réel)</span>
                <span>50% (Split 50/50)</span>
                <span>100% (Promotion Totale)</span>
              </div>
            </div>
          </div>
        )}

        {selectedStrategy === 'ROLLING' && (
          <div className="space-y-2 text-xs">
            <h4 className="text-sm font-bold text-slate-900">Ordonnancement Rolling</h4>
            <p className="text-slate-500">
              Mise à jour par lots de 25% des pods avec délai de validation des sondes de disponibilité de 15s.
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              MaxSurge: 25% • MaxUnavailable: 0% • ReadinessGracePeriod: 10s
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Stepper Visualization */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Pipeline Standard de Déploiement Team 4 (7 Étapes Normées)
            </h3>
          </div>
          {pipelineRunning && (
            <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
              Étape {currentStepIndex + 1}/7 en cours
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex && pipelineRunning;

            return (
              <div
                key={st.name}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : isCurrent
                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/40'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold">0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  ) : null}
                </div>
                <div className="font-semibold leading-snug">{st.name}</div>
                <div className="text-[10px] font-mono mt-1 opacity-75">{st.duration}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
