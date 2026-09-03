// NewVersionModal.jsx — Create New Version Wizard (SemVer)
import React, { useState } from 'react';
import { GitBranch, Sparkles, X, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { bumpSemVer } from '../../lib/slug';

export function NewVersionModal({ isOpen, onClose }) {
  const { selectedApp, createNewVersion, showToast } = useApp();

  const [bumpType, setBumpType] = useState('PATCH');
  const [changelog, setChangelog] = useState('');

  if (!isOpen || !selectedApp) return null;

  const currentVer = selectedApp.publishedVersionNumber || selectedApp.currentVersionNumber || '1.0.0';
  const calculatedNextVer = bumpSemVer(currentVer, bumpType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createNewVersion(selectedApp.id, {
      versionNumber: calculatedNextVer,
      changelog: changelog.trim() || `Création de la version v${calculatedNextVer} (${bumpType})`,
      environment: 'DEVELOPMENT',
    });

    if (result?.success) {
      showToast(`Nouvelle version v${result.data.versionNumber} créée avec succès`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Nouvelle Version SemVer</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Type d incrémentation SemVer</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'PATCH', desc: 'Correctifs (1.0.1)' },
                { type: 'MINOR', desc: 'Fonctionnalités (1.1.0)' },
                { type: 'MAJOR', desc: 'Rupture (2.0.0)' },
              ].map((b) => (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => setBumpType(b.type)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    bumpType === b.type
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-black">{b.type}</span>
                  <span className="text-[9px] text-slate-500">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Numéro de version cible :</span>
            <span className="font-mono font-black text-sm text-blue-600">v{calculatedNextVer}</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes de version / Changelog</label>
            <textarea
              rows={3}
              placeholder="Ex: Ajout du module de facturation et optimisations..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30"
            >
              Créer la version
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
