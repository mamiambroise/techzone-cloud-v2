import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { executeEmergencyRollback, rollbackDeploymentAsync, fetchRollbacksAsync } from '../../store/deploymentSlice.js';
import { addToast } from '../../store/platformSlice.js';
import {
  CornerUpLeft,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
  Server,
  FileText,
} from 'lucide-react';

export default function RollbackRecoveryView() {
  const dispatch = useDispatch();
  const checkpoints = useSelector((state) => state.deployment?.rollbackCheckpoints || []);
  const providerMode = useSelector((state) => state.integration.providerMode);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(checkpoints[0]?.id || '');
  const [rollbackReason, setRollbackReason] = useState('Anomalie de latence détectée post-déploiement');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchRollbacksAsync());
    }
  }, [dispatch, providerMode]);

  const handleTriggerRollback = () => {
    if (providerMode === 'MOCK') {
      dispatch(
        executeEmergencyRollback({
          checkpointId: selectedCheckpoint,
          reason: rollbackReason,
        })
      );
      setShowConfirmModal(false);
      dispatch(
        addToast({
          type: 'warning',
          title: 'Rollback d\'Urgence Exécuté',
          message: 'Restauration logique instantanée effectuée en 5.4s sans coupure de service.',
        })
      );
    } else {
      const checkpoint = checkpoints.find((cp) => cp.id === selectedCheckpoint);
      dispatch(
        rollbackDeploymentAsync({
          deploymentId: checkpoint?.snapshotId || selectedCheckpoint,
          body: {
            reason: rollbackReason,
            startedBy: 'console-operator',
            toReleaseId: checkpoint?.version,
          },
        })
      ).then((result) => {
        setShowConfirmModal(false);
        if (result.meta.requestStatus === 'fulfilled') {
          dispatch(
            addToast({
              type: 'warning',
              title: 'Rollback d\'Urgence Exécuté',
              message: `Rollback effectué vers ${checkpoint?.version || 'la version précédente'}.`,
            })
          );
        }
      }).catch(() => {
        setShowConfirmModal(false);
        dispatch(
          addToast({
            type: 'error',
            title: 'Échec du rollback',
            message: 'Impossible d\'exécuter le rollback.',
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
                DEP-CDC-05
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                ROLLBACK & DISASTER RECOVERY
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Rollback Logique Instantané & Reprise après Incident
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Mécanisme de sécurité critique garantissant un retour arrière en moins de 10 secondes (MTTR)
              vers un Snapshot plateforme immuable (PF-CDC-06). Bascule transparente de charge sans interruption de service.
            </p>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
          >
            <CornerUpLeft className="w-4 h-4" />
            <span>Déclencher Rollback Immédiat</span>
          </button>
        </div>
      </div>

      {/* SLA Metric Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">SLA Contractuel MTTR</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">&lt; 10.0 s</div>
          <div className="text-[11px] text-emerald-600 font-medium">Engagement de service Team 4</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Dernière Mesure Réelle</span>
          <div className="text-2xl font-bold text-blue-600 font-mono">5.4 s</div>
          <div className="text-[11px] text-blue-600 font-medium">Test de résilience du 03/09/2026</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Disponibilité pendant Rollback</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">100.0%</div>
          <div className="text-[11px] text-emerald-600 font-medium">0 requête perdue (Zéro Downtime)</div>
        </div>
      </div>

      {/* Available Checkpoints */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Points de Restauration Immédiats (Snapshots Vérifiés)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">2 Checkpoints Actifs</span>
        </div>

        <div className="divide-y divide-slate-200">
          {checkpoints.map((cp) => (
            <div
              key={cp.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/70 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{cp.app}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {cp.version}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {cp.environment}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Snapshot ID: {cp.snapshotId}</span>
                  <span>•</span>
                  <span>Temps estimé : {cp.restoreTimeEstSeconds}s</span>
                  <span>•</span>
                  <span>Créé le : {cp.timestamp}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCheckpoint(cp.id);
                  setShowConfirmModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Restaurer vers {cp.version}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirmation de Rollback d'Urgence</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vous vous apprêtez à déclencher une restauration logique immédiate. Le trafic réseau sera réacheminé
              vers la version stable précédente en moins de 10 secondes.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif de l'opération (pour audit) :
              </label>
              <textarea
                rows={2}
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleTriggerRollback}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Confirmer et Restaurer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
