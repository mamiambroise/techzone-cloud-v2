// NewPackVersionModal.jsx — PM-CDC-03: Modal to create a new pack version
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Layers, X, GitBranch, Sparkles, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { isValidSemver, suggestNextSemver } from '../../../lib/packDependencyResolver';

export default function NewPackVersionModal({ isOpen, onClose, targetPackId }) {
  const { packs, packVersions, createPackVersion, showToast } = useApp();

  const activePackId = targetPackId || packs[0]?.id;
  const currentPack = packs.find((p) => p.id === activePackId);
  const packExistingVersions = packVersions.filter((v) => v.packId === activePackId);
  const latestVersion = packExistingVersions[0]?.versionNumber || '1.0.0';

  const [versionNumber, setVersionNumber] = useState(suggestNextSemver(latestVersion, 'PATCH'));
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [cloneFromVersionId, setCloneFromVersionId] = useState(packExistingVersions[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentPack) return null;

  const handleSuggest = (type) => {
    setVersionNumber(suggestNextSemver(latestVersion, type));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!versionNumber.trim()) {
      showToast('Veuillez spécifier un numéro de version.', 'error');
      return;
    }

    if (!isValidSemver(versionNumber.trim())) {
      showToast('Numéro de version invalide. Format semver requis (ex: 1.3.0 ou 2.0.0-rc1).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPackVersion({
        packId: currentPack.id,
        versionNumber: versionNumber.trim(),
        label: label.trim() || `Version ${versionNumber.trim()}`,
        description: description.trim(),
        cloneFromVersionId: cloneFromVersionId || null,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nouvelle Version de Pack</h3>
              <p className="text-xs text-slate-300">
                Pack cible : <span className="font-semibold text-cyan-300">{currentPack.name}</span> ({currentPack.code})
              </p>
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
          {/* SemVer Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Numéro de Version (SemVer 2.0.0) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => handleSuggest('PATCH')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                +0.0.1 (Patch)
              </button>
              <button
                type="button"
                onClick={() => handleSuggest('MINOR')}
                className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-[11px] font-semibold text-cyan-800 transition-colors"
              >
                +0.1.0 (Minor)
              </button>
              <button
                type="button"
                onClick={() => handleSuggest('MAJOR')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-[11px] font-semibold text-indigo-800 transition-colors"
              >
                +1.0.0 (Major)
              </button>
            </div>
            <input
              type="text"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="ex: 1.3.0 ou 2.0.0-rc1"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Libellé / Titre de la version
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Release Q3 - Support code-barres & règles B2B"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Changelog / Description des évolutions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des modules ajoutés, corrections ou règles mises à jour..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
            />
          </div>

          {/* Clone source */}
          {packExistingVersions.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Cloner l'arborescence depuis une version existante
              </label>
              <select
                value={cloneFromVersionId}
                onChange={(e) => setCloneFromVersionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Démarrer avec une version vierge --</option>
                {packExistingVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} ({v.status}) - {v.label || v.description?.slice(0, 30)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Duplique les modules, fonctionnalités, capabilities, dépendances et règles déclarées.
              </p>
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
              {isSubmitting ? 'Création...' : 'Créer la Version Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
