import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { approvePromotionGate, fetchGatesAsync, approveGateAsync } from '../../store/deploymentSlice.js';
import { addToast } from '../../store/platformSlice.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  UserCheck,
  FileCheck,
  Check,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function PromotionGatewaysView() {
  const dispatch = useDispatch();
  const promotionGates = useSelector((state) => state.deployment?.promotionGates || []);
  const providerMode = useSelector((state) => state.integration.providerMode);

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchGatesAsync('dep-101'));
    }
  }, [dispatch, providerMode]);

  const handleApprove = (gateId) => {
    if (providerMode === 'MOCK') {
      dispatch(
        approvePromotionGate({
          gateId,
          approverName: 'SecOps + Platform Lead (You)',
        })
      );
      dispatch(
        addToast({
          type: 'success',
          title: 'Porte de Sécurité Validée',
          message: 'La release a reçu les approbations requises et est éligible au déploiement en Production.',
        })
      );
    } else {
      dispatch(
        approveGateAsync({
          deploymentId: 'dep-101',
          gateId,
          body: {
            approvedBy: 'SecOps + Platform Lead (You)',
            comment: 'Approbation via PromotionGatewaysView',
          },
        })
      ).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          dispatch(
            addToast({
              type: 'success',
              title: 'Porte de Sécurité Validée',
              message: 'La release a reçu les approbations requises et est éligible au déploiement en Production.',
            })
          );
        }
      }).catch(() => {
        dispatch(
          addToast({
            type: 'error',
            title: 'Échec de l\'approbation',
            message: 'Impossible d\'approuver la gate de déploiement.',
          })
        );
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                DEP-CDC-04
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                PORTES DE SÉCURITÉ & PROMOTIONS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Promotion Contrôlée & Portes de Sécurité (Gateways)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Workflow strict d’approbation pour la promotion d'environnements (DEV → TEST → STAGING → PROD).
              Chaque passage nécessite la validation formelle des tests E2E, des audits de sécurité et des seuils de performance.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Progression Diagram */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-4">
          Chaîne Formelle de Promotion d'Environnements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
            <div className="font-mono font-bold text-slate-700">1. DEVELOPMENT</div>
            <div className="text-[11px] text-slate-500">Intégration continue, lint & tests unitaires.</div>
            <div className="text-[10px] font-mono text-emerald-600 font-semibold pt-1">Auto-déploiement</div>
          </div>

          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 text-xs space-y-1">
            <div className="font-mono font-bold text-blue-800">2. TEST (QA)</div>
            <div className="text-[11px] text-slate-600">Batterie de 520 tests automatisés & régression.</div>
            <div className="text-[10px] font-mono text-blue-700 font-semibold pt-1">Gate: QA Pass Rate</div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs space-y-1">
            <div className="font-mono font-bold text-amber-800">3. STAGING (Pre-Prod)</div>
            <div className="text-[11px] text-slate-600">Tests de charge, injection d'erreurs & validation client.</div>
            <div className="text-[10px] font-mono text-amber-700 font-semibold pt-1">Gate: Canary & SLA</div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs space-y-1">
            <div className="font-mono font-bold text-emerald-800">4. PRODUCTION</div>
            <div className="text-[11px] text-slate-600">Haute disponibilité, zéro coupure & audit trail.</div>
            <div className="text-[10px] font-mono text-emerald-700 font-semibold pt-1">Gate: Sign-off CAB + SecOps</div>
          </div>
        </div>
      </div>

      {/* Promotion Gates List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
          Demandes de Promotion en Attente d'Approbation
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {promotionGates.map((gate) => {
            const isApproved = gate.status === 'APPROVED';

            return (
              <div
                key={gate.id}
                className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                  isApproved ? 'border-emerald-300' : 'border-amber-300 ring-1 ring-amber-400/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {gate.appName} ({gate.version})
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                      <span>Promotion : {gate.fromEnv}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-emerald-700">{gate.toEnv}</span>
                      <span>• Demandé par {gate.requester}</span>
                    </div>
                  </div>

                  {!isApproved && (
                    <button
                      onClick={() => handleApprove(gate.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Valider les Portes & Autoriser Production</span>
                    </button>
                  )}
                </div>

                {/* Checklist Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tests E2E</span>
                      {gate.checklist.e2eTestsPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 mt-1">{gate.metrics.testPassRate}</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">SLA Latence (p99)</span>
                      {gate.checklist.performanceSlaMet ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 mt-1">{gate.metrics.p99LatencyMs} ms</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Audit Sécurité SecOps</span>
                      {gate.checklist.securitySignOff ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 mt-1">
                      {gate.checklist.securitySignOff ? 'Approuvé' : 'En attente'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Snapshot PF-06</span>
                      {gate.checklist.immutableSnapshotTaken ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 mt-1">Prêt pour Rollback</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Sign-off CAB</span>
                      {gate.checklist.cabApproval ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 mt-1">
                      {gate.checklist.cabApproval ? 'Signé' : 'Requis pour PROD'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
