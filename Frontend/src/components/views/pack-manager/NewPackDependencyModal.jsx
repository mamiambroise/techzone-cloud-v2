// NewPackDependencyModal.jsx — PM-CDC-06: Modal to declare dependencies between packs
import React, { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { GitMerge, X, AlertCircle, CheckCircle2 } from "lucide-react";

export default function NewPackDependencyModal({
  isOpen,
  onClose,
  sourcePackVersionId,
  sourcePackCode,
}) {
  const { packs, createPackDependency, showToast } = useApp();

  const availablePacks = packs.filter((p) => p.code !== sourcePackCode);

  const [targetPackCode, setTargetPackCode] = useState(
    availablePacks[0]?.code || "",
  );
  const [versionRange, setVersionRange] = useState(">=1.0.0");
  const [dependencyType, setDependencyType] = useState("REQUIRED"); // 'REQUIRED' | 'OPTIONAL' | 'INCOMPATIBLE' | 'EXTENDS'
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPackCode) {
      showToast("Veuillez sélectionner un pack cible.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPackDependency({
        sourcePackVersionId,
        sourcePackCode,
        targetPackCode,
        versionRange: versionRange.trim() || ">=1.0.0",
        dependencyType,
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Nouvelle Dépendance Inter-Packs
              </h3>
              <p className="text-xs text-slate-300">
                Source :{" "}
                <span className="text-indigo-300 font-bold">
                  {sourcePackCode}
                </span>
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
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700"
        >
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pack Cible <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetPackCode}
              onChange={(e) => setTargetPackCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            >
              {availablePacks.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Plage SemVer requise <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={versionRange}
                onChange={(e) => setVersionRange(e.target.value)}
                placeholder="ex: ^1.2.0 ou >=1.0.0"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ex: ^1.0.0, ~1.2.0, &gt;=2.0.0
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type de Dépendance
              </label>
              <select
                value={dependencyType}
                onChange={(e) => setDependencyType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="REQUIRED">REQUIRED (Indispensable)</option>
                <option value="OPTIONAL">OPTIONAL (Recommandé)</option>
                <option value="EXTENDS">EXTENDS (Surcouche)</option>
                <option value="INCOMPATIBLE">
                  INCOMPATIBLE (Conflit bloquant)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description / Justification
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Raison de la dépendance ou modules requis dans le pack cible..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Déclaration..." : "Déclarer la Dépendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
