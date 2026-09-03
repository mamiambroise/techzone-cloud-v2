// NewPackFeatureModal.jsx — PM-CDC-04: Modal to add a feature to a module
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ToggleLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NewPackFeatureModal({ isOpen, onClose, moduleId, packVersionId }) {
  const { createPackFeature, showToast } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [featureType, setFeatureType] = useState('TOGGLE'); // 'TOGGLE' | 'CONFIGURABLE' | 'DATA_SOURCE' | 'ACTION' | 'WORKFLOW'
  const [isRequired, setIsRequired] = useState(false);
  const [isDefaultEnabled, setIsDefaultEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom de la fonctionnalité est requis.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPackFeature({
        moduleId,
        packVersionId,
        name: name.trim(),
        code: code.trim() || name.trim(),
        description: description.trim(),
        featureType,
        isRequired,
        isDefaultEnabled: isRequired ? true : isDefaultEnabled,
        enabled: isRequired ? true : isDefaultEnabled,
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
              <ToggleLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nouvelle Fonctionnalité</h3>
              <p className="text-xs text-slate-300">PM-CDC-04 Feature Flag & Toggles</p>
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
              Nom de la Fonctionnalité <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
              }}
              placeholder="ex: Scan Code-Barres EAN-13 & QR"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Code Unique
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ex: barcode_scanner"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type de Feature
              </label>
              <select
                value={featureType}
                onChange={(e) => setFeatureType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
              >
                <option value="TOGGLE">TOGGLE (Interrupteur On/Off)</option>
                <option value="CONFIGURABLE">CONFIGURABLE (Paramètres riches)</option>
                <option value="DATA_SOURCE">DATA_SOURCE (Source de données)</option>
                <option value="ACTION">ACTION (Traitement unitaire)</option>
                <option value="WORKFLOW">WORKFLOW (Processus séquentiel)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du comportement activé..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
            />
          </div>

          <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span className="font-semibold text-slate-800">Obligatoire (Non désactivable)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefaultEnabled}
                onChange={(e) => setIsDefaultEnabled(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span className="font-semibold text-slate-800">Activé par défaut</span>
            </label>
          </div>

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
              {isSubmitting ? 'Ajout...' : 'Ajouter la Fonctionnalité'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
