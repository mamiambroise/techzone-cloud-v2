// NewPackModuleModal.jsx — PM-CDC-04: Modal to create a new module in a pack version
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Package, X, CheckCircle2, Shield } from 'lucide-react';

export default function NewPackModuleModal({ isOpen, onClose, packVersionId }) {
  const { createPackModule, showToast } = useApp();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [moduleType, setModuleType] = useState('STANDARD'); // 'CORE' | 'STANDARD' | 'EXTENSION' | 'INTEGRATION'
  const [isRequired, setIsRequired] = useState(false);
  const [isDefaultEnabled, setIsDefaultEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom du module est obligatoire.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = createPackModule({
        packVersionId,
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        code: code.trim() || name.trim(),
        description: description.trim(),
        moduleType,
        isRequired: moduleType === 'CORE' ? true : isRequired,
        isDefaultEnabled: moduleType === 'CORE' ? true : isDefaultEnabled,
      });

      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nouveau Module de Pack</h3>
              <p className="text-xs text-slate-300">PM-CDC-04 Déclaration structurelle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nom du Module <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
              }}
              placeholder="ex: Gestion des Stocks & Mouvements"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Code Unique / Identifiant
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ex: stock_movements"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nom Court / Sigle
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="ex: Mouvements"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Type de Module
            </label>
            <select
              value={moduleType}
              onChange={(e) => {
                setModuleType(e.target.value);
                if (e.target.value === 'CORE') {
                  setIsRequired(true);
                  setIsDefaultEnabled(true);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            >
              <option value="CORE">CORE (Socle obligatoire du pack)</option>
              <option value="STANDARD">STANDARD (Module fonctionnel de base)</option>
              <option value="EXTENSION">EXTENSION (Module additionnel optionnel)</option>
              <option value="INTEGRATION">INTEGRATION (Connecteur tiers ou passerelle)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description / Rôle
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des cas d'usage et périmètre du module..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
            />
          </div>

          {moduleType !== 'CORE' && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">Module Obligatoire pour ce pack</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefaultEnabled}
                  onChange={(e) => setIsDefaultEnabled(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">Activé par défaut à l'installation</span>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer le Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
