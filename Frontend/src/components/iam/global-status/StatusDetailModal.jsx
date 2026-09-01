// StatusDetailModal.jsx — In-Depth Diagnostic & Inspection Drawer for Global Status Cards
import React from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Server,
  KeyRound,
  Users,
  Building,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { resolveStatusTheme } from '../../../types/iamDomain';

export function StatusDetailModal({
  isOpen,
  onClose,
  type = 'health',
  healthData,
  securityData,
  readinessData,
  contextData,
  onTriggerDiagnostic,
}) {
  if (!isOpen) return null;

  // Resolve current active data payload
  let title = 'Diagnostic IAM';
  let subtitle = '';
  let status = 'HEALTHY';
  let category = 'health';
  let Icon = Activity;

  if (type === 'health') {
    title = 'Platform Health — Diagnostic Technique';
    subtitle = 'État opérationnel des composants du moteur IAM, latence des micro-services et sondes réseau.';
    status = healthData?.status || 'HEALTHY';
    category = 'health';
    Icon = Activity;
  } else if (type === 'security') {
    title = 'Security Posture — Analyse des Menaces & Risques';
    subtitle = 'Surveillance continue des sessions, couverture 2FA, tentatives d intrusion et conformité Zero-Trust.';
    status = securityData?.status || 'SECURE';
    category = 'security';
    Icon = ShieldCheck;
  } else if (type === 'readiness') {
    title = 'IAM Readiness — Complétude & Éligibilité';
    subtitle = 'Audit de cohérence de l annuaire, attribution des rôles RBAC et validation des règles d accès.';
    status = readinessData?.status || 'READY';
    category = 'readiness';
    Icon = Sparkles;
  } else if (type === 'context') {
    title = 'Context Integrity — Matrice de Résolution des Contextes';
    subtitle = 'Vérification de l isolation multi-tenant, détection des collisions d attributs et latence de routage.';
    status = contextData?.status || 'VERIFIED';
    category = 'context';
    Icon = Compass;
  }

  const theme = resolveStatusTheme(status, category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Dynamic Status Header */}
        <div className={`p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50 relative`}>
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.topBar}`} />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${theme.iconBg} shadow-xs flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${theme.badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${theme.dotBg} animate-pulse`} />
                  <span>{status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          {/* 1. HEALTH MODAL BODY */}
          {type === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Score Global</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{healthData?.score}%</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Nominal</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Services Opérationnels</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {healthData?.operationalCount} / {healthData?.totalCount}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{healthData?.degradedCount} dégradé</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Latence Réseau</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{healthData?.avgLatencyMs} ms</div>
                  <span className="text-[10px] text-slate-500 font-semibold">p95: {healthData?.p95LatencyMs} ms</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  Micro-Services IAM Supervisés
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {healthData?.services?.map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            s.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate">{s.name}</span>
                          {s.note && <span className="text-[10px] text-amber-600 block">{s.note}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-[11px] text-slate-500">{s.latencyMs}ms</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            s.status === 'OPERATIONAL'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. SECURITY MODAL BODY */}
          {type === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Indice de Posture</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{securityData?.score} / 100</div>
                  <span className="text-[10px] text-emerald-600 font-bold">{securityData?.level}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sessions Suspectes</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{securityData?.suspiciousSessionsCount}</div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Zéro anomalie</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2FA Admins Protégés</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{securityData?.adminTwoFactorCoverageRate}%</div>
                  <span className="text-[10px] text-slate-500 font-semibold">{securityData?.privilegedAccountsCount} super-admins</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  Politiques de Sécurité Zero-Trust Appliquées
                </h4>
                <div className="space-y-2">
                  {securityData?.zeroTrustRules?.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{rule.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rule.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. READINESS MODAL BODY */}
          {type === 'readiness' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Score de Complétude</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{readinessData?.score}%</div>
                  <span className="text-[10px] text-teal-600 font-bold">Prêt au déploiement</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Blocages Actifs</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{readinessData?.blockersCount}</div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Aucun bloquant</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Avertissements</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{readinessData?.warningsCount}</div>
                  <span className="text-[10px] text-amber-600 font-semibold">Non-bloquant</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  Critères d Éligibilité IAM
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {readinessData?.criteria?.map((c, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-800">{c.label}</span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-black bg-slate-50 text-slate-800 border border-slate-200 font-mono">
                        {c.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. CONTEXT MODAL BODY */}
          {type === 'context' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Taux d Intégrité</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{contextData?.score}%</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Vérifié & Intègre</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Contextes Résolus</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{contextData?.resolvedCount}</div>
                  <span className="text-[10px] text-slate-500 font-semibold">Sur {contextData?.totalEvaluations}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Conflits d Attributs</span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{contextData?.conflictCount}</div>
                  <span className="text-[10px] text-amber-600 font-semibold">1 résolu automatiquement</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  Répartition des Contextes d Exécution
                </h4>
                <div className="space-y-2">
                  {contextData?.breakdown?.map((b, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${b.color}`} />
                        <span className="text-xs font-bold text-slate-800">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{b.count}</span>
                        <span className="text-[11px] text-slate-400">({b.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (onTriggerDiagnostic) onTriggerDiagnostic();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-vérifier en direct</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusDetailModal;
