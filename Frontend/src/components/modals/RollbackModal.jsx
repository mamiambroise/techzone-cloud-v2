"use client";

import React, { useState, useEffect } from "react";
import { History, X, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api-client";
import confetti from "canvas-confetti";

export function RollbackModal({ application, versions, isOpen, onClose, onRollbackComplete }) {
  const [targetVersionId, setTargetVersionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableVersions = (versions || []).filter((v) => v.id !== application?.publishedVersionId);

  useEffect(() => {
    if (availableVersions.length > 0) {
      setTargetVersionId(availableVersions[0].id);
      setConfirmed(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, application, versions]);

  if (!isOpen || !application) return null;

  const selectedTargetVersion = versions.find((v) => v.id === targetVersionId);

  const handleRollback = async (e) => {
    e.preventDefault();
    if (!targetVersionId) return;

    if (!confirmed) {
      setError("Veuillez cocher la confirmation d'impact pour continuer.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.rollbackVersion(application.id, targetVersionId, application.environment);

      if (!res.success) {
        setError(res.error?.message || "Échec du rollback.");
        setLoading(false);
        return;
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
      if (onRollbackComplete) onRollbackComplete();
    } catch (err) {
      setError(err.message || "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restaurer une Version (Rollback)</h3>
              <p className="text-xs text-slate-500">{application.name} ({application.code})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRollback} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400">Version Actuelle Publiée</p>
              <p className="text-sm font-black text-slate-800 font-mono mt-1">
                {application.publishedVersionNumber ? `v${application.publishedVersionNumber}` : "Aucune"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-[10px] font-bold uppercase text-amber-700">Version Cible à Restaurer</p>
              <p className="text-sm font-black text-amber-900 font-mono mt-1">
                {selectedTargetVersion ? `v${selectedTargetVersion.versionNumber}` : "Sélectionner..."}
              </p>
            </div>
          </div>

          {availableVersions.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-100 text-center text-xs text-slate-600 space-y-1">
              <ShieldAlert className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-bold">Aucune version antérieure disponible pour le rollback</p>
              <p className="text-[11px] text-slate-400">Créez et publiez d'autres versions pour activer cette fonction.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sélectionnez la version à restaurer :
              </label>
              <select
                value={targetVersionId}
                onChange={(e) => setTargetVersionId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              >
                {availableVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber} ({v.status}) - {v.comment || "Sans commentaire"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Règles et Traçabilité du Rollback (Specs Section 18) :
            </p>
            <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
              <li>Aucune version ni aucun historique n'est supprimé.</li>
              <li>Une opération d'audit de type <span className="font-bold">ROLLBACK</span> est consignée.</li>
              <li>La version cible v{selectedTargetVersion?.versionNumber} redevient active immédiatement.</li>
            </ul>
          </div>

          {availableVersions.length > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Je confirme vouloir restaurer la version <span className="font-bold">{selectedTargetVersion?.versionNumber}</span> en production.
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || availableVersions.length === 0 || !confirmed}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restauration...</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4" />
                  <span>Confirmer le Rollback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
