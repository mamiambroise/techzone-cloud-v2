// RollbackModal.jsx — Rollback to Previous Published Version (BM-CDC-00 Section 30)
import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function RollbackModal({ isOpen, onClose }) {
  const { selectedApp, appVersions, rollbackToVersion, showToast } = useApp();
  const [targetVersionId, setTargetVersionId] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen || !selectedApp) return null;

  const previousVersions = appVersions.filter((v) => v.status === 'SUPERSEDED' || v.status === 'PUBLISHED');

  const handleRollback = (e) => {
    e.preventDefault();
    if (!targetVersionId) {
      showToast('Veuillez sélectionner une version cible', 'warning');
      return;
    }
    rollbackToVersion(selectedApp.id, targetVersionId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Rollback de version</h3>
              <p className="text-[11px] text-slate-500">Pour {selectedApp.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRollback} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Le rollback restaure l état exact de la version sélectionnée via son snapshot déterministe.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Sélectionner la version à restaurer
            </label>
            <select
              required
              value={targetVersionId}
              onChange={(e) => setTargetVersionId(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Sélectionnez une version...</option>
              {previousVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({v.status}) • Snapshot: {v.snapshotHash?.substring(0, 12)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Motif du rollback</label>
            <textarea
              rows={2}
              placeholder="Ex: Régression détectée sur le module de paiement..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-95"
            >
              Confirmer le Rollback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
