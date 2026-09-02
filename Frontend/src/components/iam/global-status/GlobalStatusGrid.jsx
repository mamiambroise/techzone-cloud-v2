// GlobalStatusGrid.jsx — Global Status Grid Container Component (IAM-CDC-01 Section 10)
// Houses HealthCard, SecurityPostureCard, ReadinessCard, and ContextIntegrityCard with live state & simulation tools

import React, { useState } from 'react';
import {
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Shield,
  Activity,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { HealthCard } from './HealthCard';
import { SecurityPostureCard } from './SecurityPostureCard';
import { ReadinessCard } from './ReadinessCard';
import { ContextIntegrityCard } from './ContextIntegrityCard';
import { StatusDetailModal } from './StatusDetailModal';
import {
  calculatePlatformHealth,
  calculateSecurityPosture,
  calculateIAMReadiness,
  calculateContextIntegrity,
} from '../../../lib/iamStatusService';

export function GlobalStatusGrid({
  users = [],
  securityLogs = null,
  onOpenAuditView,
  className = '',
}) {
  // State for raw status payloads
  const [healthData, setHealthData] = useState(() => calculatePlatformHealth());
  const [securityData, setSecurityData] = useState(() => calculateSecurityPosture(users, securityLogs));
  const [readinessData, setReadinessData] = useState(() => calculateIAMReadiness(users));
  const [contextData, setContextData] = useState(() => calculateContextIntegrity());

  // Interactive diagnostic states
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedModalType, setSelectedModalType] = useState(null);
  const [showSimulations, setShowSimulations] = useState(false);

  // Trigger live refresh & diagnostic
  const handleRunFullDiagnostic = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      setHealthData(calculatePlatformHealth());
      setSecurityData(calculateSecurityPosture(users, securityLogs));
      setReadinessData(calculateIAMReadiness(users));
      setContextData(calculateContextIntegrity());
      setIsDiagnosing(false);
    }, 450);
  };

  // Anomaly simulators to demonstrate dynamic status-based coloring in real time
  const handleSimulateStatus = (card, scenario) => {
    if (card === 'health') {
      if (scenario === 'WARNING') {
        setHealthData((prev) => ({
          ...prev,
          status: 'WARNING',
          score: 84,
          degradedCount: 2,
          operationalCount: 7,
          avgLatencyMs: 48,
          summary: '7/9 services opérationnels • 2 micro-services en latence accrue',
        }));
      } else if (scenario === 'CRITICAL') {
        setHealthData((prev) => ({
          ...prev,
          status: 'CRITICAL',
          score: 42,
          criticalCount: 2,
          operationalCount: 5,
          avgLatencyMs: 140,
          summary: 'Incident critique: Panne sur Token Signer & Vault Store',
        }));
      } else {
        setHealthData(calculatePlatformHealth());
      }
    } else if (card === 'security') {
      if (scenario === 'HIGH_RISK') {
        setSecurityData((prev) => ({
          ...prev,
          status: 'HIGH_RISK',
          score: 58,
          level: 'Niveau 3 (Risque Élevé)',
          suspiciousSessionsCount: 2,
          lockedAccountsCount: 1,
          failedLogins24h: 7,
          summary: 'Tentatives d intrusion par force brute détectées (IP bloquée)',
        }));
      } else if (scenario === 'CRITICAL') {
        setSecurityData((prev) => ({
          ...prev,
          status: 'CRITICAL',
          score: 25,
          level: 'Niveau 4 (Critique)',
          suspiciousSessionsCount: 5,
          lockedAccountsCount: 3,
          summary: 'Attaque active: Brèche de session suspectée sur compte privilège',
        }));
      } else {
        setSecurityData(calculateSecurityPosture(users, securityLogs));
      }
    } else if (card === 'readiness') {
      if (scenario === 'INCOMPLETE') {
        setReadinessData((prev) => ({
          ...prev,
          status: 'INCOMPLETE',
          score: 62,
          blockersCount: 2,
          warningsCount: 3,
          erpCompleteness: 40,
          summary: 'Configuration incomplète: 2 utilisateurs sans rôle et annuaire non lié',
        }));
      } else if (scenario === 'OPTIMAL') {
        setReadinessData((prev) => ({
          ...prev,
          status: 'OPTIMAL',
          score: 98,
          blockersCount: 0,
          warningsCount: 0,
          erpCompleteness: 100,
          summary: 'Configuration 100% cohérente et conforme pour la production',
        }));
      } else {
        setReadinessData(calculateIAMReadiness(users));
      }
    } else if (card === 'context') {
      if (scenario === 'CONFLICT') {
        setContextData((prev) => ({
          ...prev,
          status: 'CONFLICT',
          score: 74.2,
          conflictCount: 4,
          resolvedCount: 210,
          invalidCount: 2,
          summary: '4 collisions d attributs de contexte et 2 formats invalides',
        }));
      } else if (scenario === 'VERIFIED') {
        setContextData((prev) => ({
          ...prev,
          status: 'VERIFIED',
          score: 100,
          conflictCount: 0,
          invalidCount: 0,
          resolvedCount: 300,
          summary: '100% des contextes validés sans aucune collision',
        }));
      } else {
        setContextData(calculateContextIntegrity());
      }
    }
  };

  const handleResetAll = () => {
    setHealthData(calculatePlatformHealth());
    setSecurityData(calculateSecurityPosture(users, securityLogs));
    setReadinessData(calculateIAMReadiness(users));
    setContextData(calculateContextIntegrity());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Section Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                Global Status & Gouvernance IAM
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Temps Réel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervision unifiée : Santé des services, Posture de sécurité, Préparation et Intégrité contextuelle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Simulation Toggle */}
          <button
            onClick={() => setShowSimulations(!showSimulations)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              showSimulations
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title="Tester les changements de couleurs dynamiques"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Simuler Statuts</span>
          </button>

          {/* Run Diagnostic Button */}
          <button
            onClick={handleRunFullDiagnostic}
            disabled={isDiagnosing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'Diagnostic en cours...' : 'Diagnostic Live'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Simulation Bar (Toggleable) */}
      {showSimulations && (
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-slate-800 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-black text-amber-950">
                Banc d essai des colorations dynamiques (IAM-CDC-01 Section 10)
              </span>
            </div>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser aux valeurs nominales</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-600">
            Cliquez sur les boutons ci-dessous pour déclencher dynamiquement les variations d état et vérifier l adaptation automatique des palettes de couleur (Vert, Bleu, Ambre, Orange, Rouge).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            {/* Health Simulations */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Platform Health</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSimulateStatus('health', 'HEALTHY')}
                  className="flex-1 px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  Healthy
                </button>
                <button
                  onClick={() => handleSimulateStatus('health', 'WARNING')}
                  className="flex-1 px-1.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 hover:bg-amber-100"
                >
                  Warning
                </button>
                <button
                  onClick={() => handleSimulateStatus('health', 'CRITICAL')}
                  className="flex-1 px-1.5 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 hover:bg-rose-100"
                >
                  Critical
                </button>
              </div>
            </div>

            {/* Security Simulations */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Security Posture</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSimulateStatus('security', 'SECURE')}
                  className="flex-1 px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  Secure
                </button>
                <button
                  onClick={() => handleSimulateStatus('security', 'HIGH_RISK')}
                  className="flex-1 px-1.5 py-1 rounded bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200 hover:bg-orange-100"
                >
                  High Risk
                </button>
                <button
                  onClick={() => handleSimulateStatus('security', 'CRITICAL')}
                  className="flex-1 px-1.5 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 hover:bg-rose-100"
                >
                  Breach
                </button>
              </div>
            </div>

            {/* Readiness Simulations */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">IAM Readiness</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSimulateStatus('readiness', 'OPTIMAL')}
                  className="flex-1 px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  Optimal
                </button>
                <button
                  onClick={() => handleSimulateStatus('readiness', 'READY')}
                  className="flex-1 px-1.5 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200 hover:bg-teal-100"
                >
                  Ready
                </button>
                <button
                  onClick={() => handleSimulateStatus('readiness', 'INCOMPLETE')}
                  className="flex-1 px-1.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 hover:bg-amber-100"
                >
                  Gaps
                </button>
              </div>
            </div>

            {/* Context Simulations */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Context Integrity</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleSimulateStatus('context', 'VERIFIED')}
                  className="flex-1 px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  100% OK
                </button>
                <button
                  onClick={() => handleSimulateStatus('context', 'HEALTHY')}
                  className="flex-1 px-1.5 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200 hover:bg-teal-100"
                >
                  Nominal
                </button>
                <button
                  onClick={() => handleSimulateStatus('context', 'CONFLICT')}
                  className="flex-1 px-1.5 py-1 rounded bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200 hover:bg-orange-100"
                >
                  Conflict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Primary Reusable Global Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Platform Health (10.1) */}
        <HealthCard
          healthData={healthData}
          onInspect={() => setSelectedModalType('health')}
        />

        {/* Card 2: Security Posture (10.2) */}
        <SecurityPostureCard
          securityData={securityData}
          onInspect={() => setSelectedModalType('security')}
        />

        {/* Card 3: IAM Readiness (10.3) */}
        <ReadinessCard
          readinessData={readinessData}
          onInspect={() => setSelectedModalType('readiness')}
        />

        {/* Card 4: Context Integrity (10.4) */}
        <ContextIntegrityCard
          contextData={contextData}
          onInspect={() => setSelectedModalType('context')}
        />
      </div>

      {/* Deep-Dive Inspection Modal */}
      <StatusDetailModal
        isOpen={Boolean(selectedModalType)}
        onClose={() => setSelectedModalType(null)}
        type={selectedModalType}
        healthData={healthData}
        securityData={securityData}
        readinessData={readinessData}
        contextData={contextData}
        onTriggerDiagnostic={handleRunFullDiagnostic}
      />
    </div>
  );
}

export default GlobalStatusGrid;
