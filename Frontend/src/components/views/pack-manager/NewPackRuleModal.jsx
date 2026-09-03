// NewPackRuleModal.jsx — PM-CDC-07: Modal to build composition & integrity rules
import React, { useState } from "react";
import { useApp } from "../../../context/AppContext";
import { Sliders, X, Plus, Trash2, CheckCircle2, Sparkles } from "lucide-react";

export default function NewPackRuleModal({
  isOpen,
  onClose,
  packVersionId,
  packCode,
}) {
  const { createPackRule, showToast } = useApp();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [ruleType, setRuleType] = useState("COMPOSITION"); // 'COMPOSITION' | 'VALIDATION' | 'INTEGRITY' | 'DYNAMIC_CONFIG'
  const [trigger, setTrigger] = useState("ON_FEATURE_CHANGE"); // 'ON_FEATURE_CHANGE' | 'ON_MODULE_ENABLE' | 'GLOBAL_EVAL'
  const [priority, setPriority] = useState(10);
  const [isActive, setIsActive] = useState(true);

  // Condition
  const [combinator, setCombinator] = useState("AND");
  const [predicates, setPredicates] = useState([
    { field: `features.stock.serial`, operator: "EQUALS", value: "true" },
  ]);

  // Effect
  const [effectType, setEffectType] = useState("REQUIRE_MODULE"); // 'REQUIRE_MODULE' | 'ENABLE_FEATURE' | 'DISABLE_FEATURE' | 'INCOMPATIBLE_CONFLICT'
  const [effectTarget, setEffectTarget] = useState("stock_movements");
  const [effectMessage, setEffectMessage] = useState(
    "Nécessite le module de mouvements.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPredicate = () => {
    setPredicates((prev) => [
      ...prev,
      { field: "features.", operator: "EQUALS", value: "true" },
    ]);
  };

  const handleRemovePredicate = (idx) => {
    setPredicates((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePredicate = (idx, field, val) => {
    setPredicates((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Le nom de la règle est requis.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPackRule({
        packVersionId,
        packCode,
        name: name.trim(),
        code: code.trim() || name.trim(),
        description: description.trim(),
        ruleType,
        trigger,
        priority: Number(priority) || 10,
        isActive,
        condition: {
          combinator,
          predicates,
        },
        effect: {
          type: effectType,
          target: effectTarget.trim(),
          message: effectMessage.trim(),
        },
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Nouvelle Règle de Composition
              </h3>
              <p className="text-xs text-slate-300">
                PM-CDC-07 Moteur Déterministe
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
              Nom de la Règle <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code)
                  setCode(
                    `rule_${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                  );
              }}
              placeholder="ex: Sérialisation requiert module Mouvements"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type
              </label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
              >
                <option value="COMPOSITION">COMPOSITION</option>
                <option value="VALIDATION">VALIDATION</option>
                <option value="INTEGRITY">INTEGRITY</option>
                <option value="DYNAMIC_CONFIG">DYNAMIC_CONFIG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Déclencheur
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              >
                <option value="ON_FEATURE_CHANGE">ON_FEATURE_CHANGE</option>
                <option value="ON_MODULE_ENABLE">ON_MODULE_ENABLE</option>
                <option value="GLOBAL_EVAL">GLOBAL_EVAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Priorité
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Condition Builder (IF) */}
          <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-purple-900 uppercase">
                  SI (Condition)
                </span>
                <select
                  value={combinator}
                  onChange={(e) => setCombinator(e.target.value)}
                  className="px-2 py-0.5 rounded-lg border border-purple-300 text-[11px] font-bold text-purple-900 bg-white"
                >
                  <option value="AND">TOUTES les conditions (ET)</option>
                  <option value="OR">AU MOINS UNE condition (OU)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddPredicate}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter Condition</span>
              </button>
            </div>

            <div className="space-y-2">
              {predicates.map((pred, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pred.field}
                    onChange={(e) =>
                      handleUpdatePredicate(idx, "field", e.target.value)
                    }
                    placeholder="Champ (ex: features.stock.serial)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-purple-200 text-xs font-mono bg-white"
                  />
                  <select
                    value={pred.operator}
                    onChange={(e) =>
                      handleUpdatePredicate(idx, "operator", e.target.value)
                    }
                    className="px-2 py-1.5 rounded-lg border border-purple-200 text-xs bg-white font-bold"
                  >
                    <option value="EQUALS">==</option>
                    <option value="NOT_EQUALS">!=</option>
                    <option value="CONTAINS">CONTIENT</option>
                    <option value="IS_TRUE">EST VRAI</option>
                    <option value="IS_FALSE">EST FAUX</option>
                  </select>
                  <input
                    type="text"
                    value={pred.value}
                    onChange={(e) =>
                      handleUpdatePredicate(idx, "value", e.target.value)
                    }
                    placeholder="Valeur (ex: true)"
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-purple-200 text-xs font-mono bg-white"
                  />
                  {predicates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePredicate(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Effect Builder (THEN) */}
          <div className="p-3.5 bg-cyan-50/50 border border-cyan-200 rounded-xl space-y-3">
            <span className="font-extrabold text-xs text-cyan-900 uppercase">
              ALORS (Effet / Mutation)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Type d'effet
                </label>
                <select
                  value={effectType}
                  onChange={(e) => setEffectType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cyan-300 text-xs bg-white font-bold text-cyan-900"
                >
                  <option value="REQUIRE_MODULE">
                    REQUIRE_MODULE (Module Obligatoire)
                  </option>
                  <option value="ENABLE_FEATURE">
                    ENABLE_FEATURE (Activer Feature)
                  </option>
                  <option value="DISABLE_FEATURE">
                    DISABLE_FEATURE (Désactiver Feature)
                  </option>
                  <option value="INCOMPATIBLE_CONFLICT">
                    INCOMPATIBLE_CONFLICT (Conflit Bloquant)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cible de l'effet
                </label>
                <input
                  type="text"
                  value={effectTarget}
                  onChange={(e) => setEffectTarget(e.target.value)}
                  placeholder="ex: stock_movements ou serial_tracking"
                  className="w-full px-3 py-2 rounded-xl border border-cyan-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Message d'explication
              </label>
              <input
                type="text"
                value={effectMessage}
                onChange={(e) => setEffectMessage(e.target.value)}
                placeholder="ex: La sérialisation impose le module mouvements de stock."
                className="w-full px-3 py-1.5 rounded-xl border border-cyan-300 text-xs"
              />
            </div>
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
              {isSubmitting ? "Création..." : "Créer la Règle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
