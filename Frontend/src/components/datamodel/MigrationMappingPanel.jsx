"use client";

import React, { useState, useMemo } from "react";
import {
  Rocket, ShieldAlert, CheckCircle2, ArrowRight, Download, Info, Settings2, GitCommit,
} from "lucide-react";

// Specs P0.2 §26/§27 (Migration Planner / Migration Mapping), C4 §13.21-13.22:
// "Pour les transformations complexes, le plan doit pouvoir définir : source, target,
//  transformation, default, fallback, validation. Aucune transformation arbitraire non
//  sécurisée ne doit être exécutée."
//
// The backend (SchemaService.createMigrationPlan) already computes `migration.mappings`
// (source/target/transformationType/fallback/validation) from the Schema Diff + Risk Engine —
// it just wasn't rendered anywhere. This panel surfaces it, and lets the operator annotate each
// mapping with a default value / fallback strategy before exporting the plan as a portable
// document. Nothing here executes a transformation: per §26, "P0.2 prépare la migration.
// L'exécution physique pourra appartenir au Data Runtime" — this stays a preparation artifact.

const RISK_STYLE = {
  SAFE: "bg-green-50 text-green-700 border-green-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  BREAKING: "bg-red-50 text-red-700 border-red-200",
  DATA_LOSS_RISK: "bg-rose-100 text-rose-800 border-rose-300",
};

const FALLBACK_STRATEGIES = [
  { value: "NONE", label: "Aucun — échoue si la transformation est impossible" },
  { value: "NULL", label: "Mettre la valeur à NULL" },
  { value: "DEFAULT_VALUE", label: "Utiliser une valeur par défaut" },
  { value: "SKIP_RECORD", label: "Ignorer l'enregistrement (Data Runtime)" },
  { value: "MANUAL_REVIEW", label: "Marquer pour revue manuelle" },
];

function mappingKey(m, i) {
  return `${(m.sourceFields || []).join(",")}→${(m.targetFields || []).join(",")}@${i}`;
}

export function MigrationMappingPanel({ migration, onGenerate, sourceVersionNumber, targetVersionNumber }) {
  // key -> { fallbackStrategy, defaultValue } — local annotations only, never persisted server-side.
  const [overrides, setOverrides] = useState({});

  const mappings = useMemo(() => migration?.mappings || [], [migration]);

  const setOverride = (key, patch) => {
    setOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] || { fallbackStrategy: "NONE", defaultValue: "" }), ...patch } }));
  };

  const exportPlan = () => {
    if (!migration) return;
    const annotatedMappings = mappings.map((m, i) => {
      const key = mappingKey(m, i);
      const o = overrides[key] || { fallbackStrategy: "NONE", defaultValue: "" };
      return {
        source: m.sourceFields,
        target: m.targetFields,
        transformation: m.transformationType,
        validation: m.validation,
        fallback: o.fallbackStrategy,
        default: o.fallbackStrategy === "DEFAULT_VALUE" ? o.defaultValue : null,
      };
    });
    const payload = {
      applicationId: migration.applicationId,
      sourceVersionId: migration.sourceVersionId,
      sourceVersionNumber,
      targetVersionId: migration.targetVersionId,
      targetVersionNumber,
      status: migration.status,
      riskSummary: migration.riskSummary,
      steps: migration.steps,
      mappings: annotatedMappings,
      note: "Plan de préparation P0.2 — aucune exécution physique. L'exécution appartient au futur Data Runtime (specs §26).",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-plan-${sourceVersionNumber || "src"}-to-${targetVersionNumber || "tgt"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = useMemo(
    () => mappings.filter((m, i) => (overrides[mappingKey(m, i)]?.fallbackStrategy || "NONE") === "NONE").length,
    [mappings, overrides]
  );

  return (
    <div className="space-y-4">
      <button onClick={onGenerate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">
        <Rocket className="w-4 h-4" /> Générer le plan de migration
      </button>

      {migration && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["Safe", migration.riskSummary.safe, "bg-green-50 text-green-700 border-green-200"],
              ["Warnings", migration.riskSummary.warnings, "bg-amber-50 text-amber-700 border-amber-200"],
              ["Breaking", migration.riskSummary.breaking, "bg-red-50 text-red-700 border-red-200"],
              ["Data Loss", migration.riskSummary.dataLoss, "bg-rose-100 text-rose-800 border-rose-300"],
            ].map(([l, v, s], i) => (
              <div key={i} className={`p-4 rounded-xl border text-center ${s}`}><p className="text-2xl font-black">{v}</p><p className="text-[10px] font-bold uppercase">{l}</p></div>
            ))}
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-center">
              <p className={`text-lg font-black ${migration.status === "READY" ? "text-green-600" : migration.status === "BLOCKED" ? "text-red-600" : "text-amber-600"}`}>{migration.status}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400">Statut</p>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
            {migration.steps.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-xs">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center">{s.order}</span>
                <span className="font-bold text-slate-800">{s.operation}</span>
                <span className="text-slate-400">{s.targetType}</span>
                <span className={`ml-auto text-[10px] font-black px-2 py-1 rounded border ${RISK_STYLE[s.riskLevel]}`}>{s.riskLevel}</span>
                {s.requiresConfirmation ? <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> confirmation</span> : <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> automatique</span>}
              </div>
            ))}
            {migration.steps.length === 0 && <p className="p-8 text-center text-xs text-slate-400">Aucune étape : schémas identiques.</p>}
          </div>

          {/* Migration Mapping (§27) */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold text-slate-800">Migration Mapping — transformations complexes ({mappings.length})</h3>
              </div>
              <button
                onClick={exportPlan}
                disabled={!migration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> Exporter le plan (JSON)
              </button>
            </div>

            {mappings.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">Aucune transformation complexe (renommage / changement de type) dans ce diff.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {mappings.map((m, i) => {
                  const key = mappingKey(m, i);
                  const o = overrides[key] || { fallbackStrategy: "NONE", defaultValue: "" };
                  return (
                    <div key={key} className="p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-700">{(m.sourceFields || []).join(", ") || "—"}</span>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase">
                          <ArrowRight className="w-3 h-3" /> {m.transformationType}
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-700">{(m.targetFields || []).join(", ") || "—"}</span>
                        <span className={`ml-auto text-[10px] font-black px-2 py-1 rounded-md ${m.validation === "AUTO" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {m.validation === "AUTO" ? "Validation automatique" : "Confirmation manuelle requise"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                        <div>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                            <Settings2 className="w-3.5 h-3.5 text-slate-400" /> Stratégie de repli (fallback)
                          </label>
                          <select
                            value={o.fallbackStrategy}
                            onChange={(e) => setOverride(key, { fallbackStrategy: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs"
                          >
                            {FALLBACK_STRATEGIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                        </div>
                        {o.fallbackStrategy === "DEFAULT_VALUE" && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Valeur par défaut</label>
                            <input
                              value={o.defaultValue}
                              onChange={(e) => setOverride(key, { defaultValue: e.target.value })}
                              placeholder="ex: 0, N/A…"
                              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {mappings.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500">
                  {pendingCount > 0
                    ? `${pendingCount} mapping(s) sans stratégie de repli explicite — l'export inclura "NONE" (échec si transformation impossible).`
                    : "Toutes les transformations ont une stratégie de repli définie."}
                  {" "}Ces annotations ne sont pas persistées côté serveur ; elles sont incluses dans l&apos;export JSON du plan.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
