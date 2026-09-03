// NewPackCapabilityModal.jsx — PM-CDC-05: Modal to declare capabilities in a pack version
import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

export default function NewPackCapabilityModal({ isOpen, onClose, packVersionId, packCode }) {
  const { createPackCapability, showToast } = useApp();

  const [name, setName] = useState('');
  const [capabilityCode, setCapabilityCode] = useState('');
  const [relationType, setRelationType] = useState('PROVIDES'); // 'PROVIDES' | 'REQUIRES' | 'USES'
  const [category, setCategory] = useState('DOMAIN'); // 'CORE' | 'DOMAIN' | 'HARDWARE' | 'INTEGRATION'
  const [stability, setStability] = useState('STABLE'); // 'STABLE' | 'EXPERIMENTAL' | 'DEPRECATED'
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capabilityCode.trim() || !name.trim()) {
      showToast('Le code et le nom de la capability sont obligatoires.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPackCapability({
        packVersionId,
        packCode,
        capabilityCode: capabilityCode.trim(),
        name: name.trim(),
        relationType,
        category,
        stability,
        description: description.trim(),
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Déclarer une Capability</h3>
              <p className="text-xs text-slate-300">PM-CDC-05 Registre des interfaces & contrats</p>
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
              Nom de la Capability <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!capabilityCode) setCapabilityCode(`cap.${packCode}.${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '.')}`);
              }}
              placeholder="ex: Gestion des Multi-Entrepôts"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Code de Capability (Identifiant universel) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={capabilityCode}
              onChange={(e) => setCapabilityCode(e.target.value)}
              placeholder="ex: cap.stock.multi_warehouse"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Relation
              </label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              >
                <option value="PROVIDES">PROVIDES (Fournie par ce pack)</option>
                <option value="REQUIRES">REQUIRES (Requise par ce pack)</option>
                <option value="USES">USES (Optionnelle / Consommée)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Stabilité
              </label>
              <select
                value={stability}
                onChange={(e) => setStability(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="STABLE">STABLE (Production ready)</option>
                <option value="EXPERIMENTAL">EXPERIMENTAL (En test)</option>
                <option value="DEPRECATED">DEPRECATED (Bientôt retirée)</option>
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
              placeholder="Contrat de service, endpoints exposés ou prérequis..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            />
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Capability'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
