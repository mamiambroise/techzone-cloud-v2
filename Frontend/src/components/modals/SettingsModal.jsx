// SettingsModal.jsx — Platform & Tenant Context Settings
import React from 'react';
import { Settings, Shield, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function SettingsModal({ isOpen, onClose }) {
  const { currentTenant, currentUser, currentRole } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Paramètres de Plateforme</h3>
              <p className="text-[11px] text-slate-500">Techzone Cloud Environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Contexte Multi-Tenant Authentifié
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Nom du Tenant :</span>
              <span className="font-bold text-slate-900">{currentTenant.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Tenant ID :</span>
              <span className="font-mono text-slate-500">{currentTenant.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Utilisateur actif :</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Rôle RBAC :</span>
              <span className="font-mono font-bold text-blue-600">{currentRole}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="font-bold text-slate-700">État du cluster :</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Prêt à l'emploi (Production)
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
