"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FlaskConical, Sparkles, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Info, Loader2, ShieldAlert,
} from "lucide-react";
import { dm } from "@/lib/api-client";
import { evaluateFormula, generateSampleValue, runValidationRules } from "@/lib/utils/formulaSandbox";

// Specs P0.2 §30/§31 (Sandbox / Sample Data), C4 §13.23 (Sandbox Service) & §14.17 (Sandbox UI):
// "Un modèle DRAFT doit pouvoir être testé sans modifier la version publiée."
// "La Sandbox doit pouvoir utiliser des données de test clairement séparées des données réelles."
//
// This panel is intentionally ephemeral: sample values live only in this component's React
// state. Nothing here is sent to any create/update-record endpoint (there isn't one — P0.2
// stores Data Model *definitions*, not business data; INV-DM-005). Validation and Formula
// results are previews computed against the DRAFT schema's declared rules — the Backend
// remains the authority the moment anything is actually saved (field defaults, publication...).

function ValueInput({ field, value, onChange, disabled }) {
  const options = field.configuration?.options || [];
  if (field.dataType === "BOOLEAN") {
    return (
      <label className="flex items-center gap-2 h-9">
        <input type="checkbox" checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="rounded text-blue-600" />
        <span className="text-xs text-slate-500">{value ? "true" : "false"}</span>
      </label>
    );
  }
  if (field.dataType === "ENUM") {
    return (
      <select disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
        <option value="">—</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label || o.value}</option>)}
      </select>
    );
  }
  if (field.dataType === "MULTI_ENUM") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <select multiple disabled={disabled} value={arr} onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))} className="w-full h-16 px-2 rounded-lg border border-slate-200 text-xs">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label || o.value}</option>)}
      </select>
    );
  }
  if (["INTEGER", "BIG_INTEGER", "DECIMAL", "CURRENCY", "PERCENTAGE"].includes(field.dataType)) {
    return <input type="number" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-mono" />;
  }
  if (field.dataType === "DATE") return <input type="date" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />;
  if (field.dataType === "DATETIME") return <input type="datetime-local" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />;
  if (field.dataType === "TIME") return <input type="time" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />;
  if (field.dataType === "LONG_TEXT") return <textarea rows={2} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-xs" />;
  return <input type="text" disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.dataType} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />;
}

export function SandboxPanel({ appId, versionId, entities }) {
  const activeEntities = useMemo(() => (entities || []).filter((e) => e.status === "ACTIVE"), [entities]);
  const [entityId, setEntityId] = useState("");
  const [fields, setFields] = useState([]);
  const [validationsByField, setValidationsByField] = useState({});
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId && activeEntities.length > 0) setEntityId(activeEntities[0].id);
  }, [activeEntities, entityId]);

  useEffect(() => {
    if (!entityId) { setFields([]); setValidationsByField({}); setValues({}); return; }
    const ent = activeEntities.find((e) => e.id === entityId);
    const fs = (ent?._fields || []).filter((f) => f.status === "ACTIVE");
    setFields(fs);
    setValues({});
    if (fs.length === 0) { setValidationsByField({}); return; }
    setLoading(true);
    Promise.all(fs.map((f) => dm.listValidations(appId, versionId, f.id))).then((results) => {
      const map = {};
      fs.forEach((f, i) => { map[f.id] = results[i]?.success ? results[i].data || [] : []; });
      setValidationsByField(map);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, appId, versionId]);

  const dataFields = fields.filter((f) => f.dataType !== "FORMULA");
  const formulaFields = fields.filter((f) => f.dataType === "FORMULA");

  const setValue = (code, v) => setValues((prev) => ({ ...prev, [code]: v }));

  const generateAll = () => {
    const next = {};
    dataFields.forEach((f) => { next[f.code] = generateSampleValue(f.dataType, f.configuration?.options); });
    setValues(next);
  };

  const clearAll = () => setValues({});

  const validationResults = useMemo(() => {
    const out = [];
    dataFields.forEach((f) => {
      const rules = validationsByField[f.id] || [];
      if (rules.length === 0) return;
      runValidationRules(values[f.code], rules).forEach((r) => out.push({ field: f, ...r }));
    });
    return out;
  }, [dataFields, validationsByField, values]);

  const formulaResults = useMemo(
    () => formulaFields.map((f) => ({ field: f, ...evaluateFormula(f.formulaExpression || "", values) })),
    [formulaFields, values]
  );

  const failedCount = validationResults.filter((r) => !r.pass).length;

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 flex items-start gap-2.5">
        <FlaskConical className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-violet-800 leading-relaxed">
          Sandbox : les valeurs saisies ci-dessous sont des <strong>données d'exemple non persistées</strong>, séparées
          des données réelles (specs §31). Elles servent uniquement à prévisualiser les règles de Validation et les
          champs Formula du schéma DRAFT — rien n'est écrit dans le Data Model ni dans un futur Data Runtime.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="w-full sm:w-72">
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Entité à tester</label>
          <select value={entityId} onChange={(e) => setEntityId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
            {activeEntities.length === 0 && <option value="">Aucune entité</option>}
            {activeEntities.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateAll} disabled={dataFields.length === 0} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Générer des données d'exemple
          </button>
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <RotateCcw className="w-3.5 h-3.5" /> Effacer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : fields.length === 0 ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded-xl space-y-1">
          <FlaskConical className="w-7 h-7 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">Aucun champ à tester</p>
          <p className="text-xs text-slate-400">Sélectionnez une entité possédant des champs, ou ajoutez-en depuis l'Entity Editor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sample data form */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-extrabold text-slate-700">Données d'exemple</p>
            {dataFields.map((f) => {
              const rowIssues = validationResults.filter((r) => r.field.id === f.id && !r.pass);
              return (
                <div key={f.id}>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                    {f.label} <span className="font-mono text-slate-400">({f.code})</span>
                    {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {/* Sandbox never mutates the schema — sample values stay editable even on a
                      PUBLISHED (read-only) version, unlike the real Field/Entity editors. */}
                  <ValueInput field={f} value={values[f.code]} onChange={(v) => setValue(f.code, v)} disabled={false} />
                  {rowIssues.map((iss, i) => (
                    <p key={i} className="text-[10px] text-red-600 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> {iss.message}</p>
                  ))}
                </div>
              );
            })}
            {dataFields.length === 0 && <p className="text-xs text-slate-400">Cette entité n'a que des champs calculés.</p>}
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Validation summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between pb-2">
                <p className="text-xs font-extrabold text-slate-700">Résultats de validation</p>
                {validationResults.length > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${failedCount === 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {failedCount === 0 ? "TOUT PASSE" : `${failedCount} ÉCHEC(S)`}
                  </span>
                )}
              </div>
              {validationResults.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune règle de validation déclarative sur cette entité.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {validationResults.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-2 text-xs">
                      {r.pass ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-bold text-slate-700 font-mono">{r.field.code} <span className="text-slate-400 font-sans">· {r.rule.type}</span></p>
                        {!r.pass && <p className="text-[11px] text-red-600">{r.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formula preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-extrabold text-slate-700 pb-2">Champs calculés (Formula)</p>
              {formulaResults.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun champ Formula sur cette entité.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {formulaResults.map((r, i) => (
                    <div key={i} className="py-2 text-xs">
                      <p className="font-mono font-bold text-violet-700 flex items-center gap-1.5">
                        <span className="text-violet-400">ƒ</span> {r.field.code}
                        <span className="text-slate-400 font-sans font-normal">= {r.field.formulaExpression}</span>
                      </p>
                      {r.ok ? (
                        <p className="text-slate-800 font-bold mt-0.5">→ {String(r.value)}</p>
                      ) : (
                        <p className="text-amber-700 flex items-center gap-1.5 mt-0.5"><AlertTriangle className="w-3.5 h-3.5" /> {r.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500">
                Simulation frontend uniquement (grammaire restreinte : + − × ÷ %, concat, round, min, max, coalesce).
                Le Backend reste l'autorité finale au moment de l'enregistrement réel des définitions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
