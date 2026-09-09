// StatusTransitionModal.jsx — Application State & Lifecycle Machine Transition
import React, { useState } from 'react';
import { GitCommit, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';

const ALLOWED_STATUSES = [
  'DRAFT',
  'CONFIGURING',
  'READY',
  'TESTING',
  'ACTIVE',
  'SUSPENDED',
  'ARCHIVED',
];

export function StatusTransitionModal({ isOpen, onClose, targetApp }) {
  const { transitionApplicationStatus, showToast } = useApp();
  const [nextStatus, setNextStatus] = useState(targetApp?.status || 'DRAFT');

  if (!isOpen || !targetApp) return null;

  const handleTransition = (e) => {
    e.preventDefault();
    transitionApplicationStatus(targetApp.id, nextStatus);
    showToast(`Statut de ${targetApp.name} mis à jour : ${nextStatus}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Transition de Statut</h3>
              <p className="text-[11px] text-slate-500">{targetApp.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleTransition} className="space-y-4 text-xs">
          <div>
            <span className="block font-bold text-slate-700 mb-2">Statut actuel :</span>
            <StatusBadge status={targetApp.status} size="md" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">Nouveau statut cible :</label>
            <div className="grid grid-cols-2 gap-2">
              {ALLOWED_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setNextStatus(st)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    nextStatus === st
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <StatusBadge status={st} size="xs" />
                </button>
              ))}
            </div>
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              Appliquer le statut
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
