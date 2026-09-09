// CloneModal.jsx — Clone Application Wizard (BM-CDC-00 Section 30)
import React, { useState } from 'react';
import { Copy, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSlug } from '../../lib/slug';

export function CloneModal({ isOpen, onClose, appToClone }) {
  const { cloneApplication, showToast } = useApp();

  const [newName, setNewName] = useState(appToClone ? `${appToClone.name} (Copie)` : '');
  const [newCode, setNewCode] = useState(appToClone ? `${appToClone.code}_COPY` : '');

  if (!isOpen || !appToClone) return null;

  const handleClone = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      showToast('Tous les champs sont obligatoires', 'warning');
      return;
    }

    const cloned = cloneApplication(appToClone.id, {
      name: newName.trim(),
      code: newCode.toUpperCase().trim(),
      slug: generateSlug(newName),
    });

    if (cloned) {
      showToast(`Application clonée avec succès : ${cloned.name}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Cloner l application</h3>
              <p className="text-[11px] text-slate-500">Source : {appToClone.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleClone} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nouveau nom d application</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
              }}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nouveau code unique (MAJUSCULES)</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
            Le clonage reproduit fidèlement la structure, les entités Data Model, les menus et initialise une version v0.1.0 (DRAFT) indépendante.
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              Cloner maintenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
