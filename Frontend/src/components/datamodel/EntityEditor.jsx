"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X, Plus, Save, Undo2, Redo2, Trash2, ArrowUp, ArrowDown, Pencil, RefreshCw,
  AlertTriangle, CheckCircle2, CloudUpload, Database, Link2, ShieldCheck, ListOrdered, BadgeCheck, GitBranch,
  FolderOpen, Layers, LayoutList,
} from "lucide-react";
import { dm } from "@/lib/api-client";
import { ImpactAnalysisModal } from "./ImpactAnalysisModal";

const TABS = [
  { key: "general", label: "General" },
  { key: "fields", label: "Fields" },
  { key: "relations", label: "Relations" },
  { key: "constraints", label: "Constraints" },
  { key: "indexes", label: "Indexes" },
  { key: "validation", label: "Validation" },
  { key: "dependencies", label: "Dependencies" },
];

const TYPE_HINT = {
  TEXT: "#64748b", LONG_TEXT: "#64748b", EMAIL: "#0ea5e9", PHONE: "#0ea5e9", URL: "#0ea5e9",
  INTEGER: "#2563eb", BIG_INTEGER: "#2563eb", DECIMAL: "#2563eb", CURRENCY: "#16a34a", PERCENTAGE: "#16a34a",
  BOOLEAN: "#9333ea", DATE: "#d97706", DATETIME: "#d97706", TIME: "#d97706", ENUM: "#db2777",
  MULTI_ENUM: "#db2777", UUID: "#475569", SEQUENCE: "#475569", FILE: "#78716c", IMAGE: "#78716c",
  JSON: "#475569", FORMULA: "#7c3aed",
};

const emptyFieldForm = {
  code: "", label: "", dataType: "TEXT", required: false, unique: false, indexed: false, readonly: false,
  defaultValue: "", formula: "", options: [{ value: "", label: "" }], scope: "ORGANIZATION", classification: "INTERNAL",
  fieldGroup: "",
};

// Specs P0.2 §17 (Field Groups): "Permettre de regrouper des champs logiquement." No dedicated
// domain object is introduced — the group name is stored inside the field's existing free-form
// `configuration` JSON (already persisted as-is by FieldService), so grouping needs no schema
// change: it's purely an organizational label on top of the existing Field definition.
const SUGGESTED_FIELD_GROUPS = ["ADDRESS", "CONTACT_INFORMATION", "DIMENSIONS", "PRICING", "IDENTITY_INFORMATION"];
const NO_GROUP = "__no_group__";

function fieldGroupOf(f) {
  return (f.fieldGroup ?? f.configuration?.fieldGroup ?? "").trim() || null;
}

function FieldRow({ f, index, showArrows, readOnly, onMove, onEdit, onArchive }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
      {showArrows && !readOnly && (
        <div className="flex flex-col">
          <button onClick={() => onMove(index, -1)} className="text-slate-300 hover:text-slate-600"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMove(index, 1)} className="text-slate-300 hover:text-slate-600"><ArrowDown className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <span className="text-slate-300 cursor-grab">≡</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1.5">
          {f.dataType === "FORMULA" && <span className="text-violet-600">ƒ</span>}{f.code}
          {(f._isNew || f._dirty) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{f.label}{f.dataType === "FORMULA" ? ` = ${f.formula || f.formulaExpression || ""}` : ""}</p>
      </div>
      <span className="text-[10px] font-black px-2 py-0.5 rounded" style={{ color: TYPE_HINT[f.dataType] || "#64748b", background: "#f1f5f9" }}>{f.dataType}</span>
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
        {f.required && <span className="text-red-500">*</span>}
        {f.unique && <span className="px-1 rounded bg-slate-100">U</span>}
        {f.indexed && <span className="px-1 rounded bg-slate-100">IX</span>}
      </div>
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onArchive(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}

export function EntityEditor({ appId, versionId, entityId, entities, readOnly, onClose, onChanged }) {
  const [tab, setTab] = useState("fields");
  const [entity, setEntity] = useState(null);
  const [serverFields, setServerFields] = useState([]);
  const [draft, setDraft] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [saveStatus, setSaveStatus] = useState("CLEAN"); // CLEAN DIRTY SAVING SAVED ERROR CONFLICT
  const [autosave, setAutosave] = useState(false);
  const [fieldForm, setFieldForm] = useState(null); // 'new' | fieldId
  const [form, setForm] = useState(emptyFieldForm);
  const [formError, setFormError] = useState(null);
  const [groupBy, setGroupBy] = useState("none"); // "none" | "group" — specs §17 Field Groups

  const [relations, setRelations] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [indexes, setIndexes] = useState([]);
  const [validations, setValidations] = useState([]);
  const [dataTypes, setDataTypes] = useState([]);

  const [entityForm, setEntityForm] = useState(null);
  const [entityError, setEntityError] = useState(null);

  const [relForm, setRelForm] = useState({ targetEntityId: "", relationType: "ONE_TO_MANY", deleteBehavior: "RESTRICT", required: false, sourceLabel: "", targetLabel: "" });
  const [consForm, setConsForm] = useState({ type: "UNIQUE", name: "", fieldIds: [] });
  const [idxForm, setIdxForm] = useState({ type: "SIMPLE", name: "", fieldIds: [] });
  const [valForm, setValForm] = useState({ fieldId: "", type: "REQUIRED", message: "", minValue: "", maxValue: "", pattern: "" });

  const [depFieldId, setDepFieldId] = useState("");
  const [deps, setDeps] = useState(null);

  // Specs §23/§46 — structural changes (type change, field/relation removal) must go through
  // an Impact Analysis confirmation gate before being applied. { change, title, run } | null.
  const [pendingImpact, setPendingImpact] = useState(null);

  const load = async () => {
    const [e, f, r, dt] = await Promise.all([
      dm.getEntity(appId, versionId, entityId),
      dm.listFields(appId, versionId, entityId),
      dm.listRelations(appId, versionId),
      dm.getDataTypes(appId, versionId),
    ]);
    if (e.success) { setEntity(e.data); setEntityForm({ name: e.data.name, code: e.data.code, pluralName: e.data.pluralName, description: e.data.description || "", scope: e.data.scope, classification: e.data.classification, icon: e.data.icon }); }
    if (f.success) { setServerFields(f.data || []); setDraft(f.data || []); setHistory([]); setFuture([]); setSaveStatus("CLEAN"); }
    if (r.success) setRelations((r.data || []).filter((x) => x.sourceEntityId === entityId || x.targetEntityId === entityId));
    if (dt.success) setDataTypes(dt.data || []);
    const [c, ix] = await Promise.all([dm.listConstraints(appId, versionId, entityId), dm.listIndexes(appId, versionId, entityId)]);
    if (c.success) setConstraints(c.data || []);
    if (ix.success) setIndexes(ix.data || []);
    const vals = await Promise.all((f.data || []).map((fd) => dm.listValidations(appId, versionId, fd.id)));
    setValidations(vals.flatMap((v) => (v.success ? v.data : [])));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entityId]);

  // ---------- undo / redo ----------
  const pushHistory = (prev) => { setHistory((h) => [...h.slice(-30), prev]); setFuture([]); };
  const mutate = (fn) => {
    pushHistory(draft);
    setDraft(fn);
    setSaveStatus("DIRTY");
  };
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [...f, draft]);
    setDraft(prev);
    setSaveStatus("DIRTY");
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setHistory((h) => [...h, draft]);
    setDraft(next);
    setSaveStatus("DIRTY");
  };

  // ---------- save ----------
  const save = async () => {
    setSaveStatus("SAVING");
    let hadConflict = false;
    let hadError = false;
    for (const f of draft) {
      if (f._isNew) {
        const payload = toPayload(f);
        const res = await dm.createField(appId, versionId, entityId, payload);
        if (!res.success) { hadError = true; setFormError(res.error?.message); }
      } else if (f._dirty) {
        const payload = { ...toPayload(f), expectedVersion: f.version };
        const res = await dm.updateField(appId, versionId, entityId, f.id, payload);
        if (!res.success) {
          if (res.error?.code === "VERSION_CONFLICT") hadConflict = true;
          else { hadError = true; setFormError(res.error?.message); }
        }
      }
    }
    if (hadConflict) { setSaveStatus("CONFLICT"); return; }
    // reorder
    const orderedIds = draft.filter((f) => !f._isNew).map((f) => f.id);
    await dm.reorderFields(appId, versionId, entityId, orderedIds);
    await load();
    onChanged && onChanged();
    setSaveStatus(hadError ? "ERROR" : "SAVED");
  };

  useEffect(() => {
    if (autosave && saveStatus === "DIRTY") {
      const t = setTimeout(save, 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [autosave, draft]);

  const toPayload = (f) => {
    // Field Groups (§17) ride on the existing free-form `configuration` JSON — no schema change.
    const fieldGroup = (f.fieldGroup ?? "").trim() || null;
    const baseConfig =
      f.dataType === "ENUM" || f.dataType === "MULTI_ENUM"
        ? { options: (f.options || []).filter((o) => o.value) }
        : f.configuration || {};
    return {
      code: f.code, label: f.label, data_type: f.dataType, required: !!f.required, unique: !!f.unique,
      indexed: !!f.indexed, readonly: !!f.readonly, default_value: f.defaultValue === "" ? null : coerceDefault(f.dataType, f.defaultValue),
      scope: f.scope, classification: f.classification,
      configuration: { ...baseConfig, fieldGroup },
      formula_expression: f.dataType === "FORMULA" ? f.formula : null,
    };
  };

  const coerceDefault = (type, v) => {
    if (["INTEGER", "BIG_INTEGER", "DECIMAL", "CURRENCY", "PERCENTAGE"].includes(type)) { const n = Number(v); return isNaN(n) ? null : n; }
    if (type === "BOOLEAN") return v === true || v === "true";
    return v;
  };

  // ---------- field form ----------
  const openFieldForm = (f) => {
    setFormError(null);
    if (f === "new") {
      setForm({ ...emptyFieldForm });
      setFieldForm("new");
    } else {
      setForm({
        code: f.code, label: f.label, dataType: f.dataType, required: f.required, unique: f.unique, indexed: f.indexed,
        readonly: f.readonly, defaultValue: f.defaultValue ?? "", formula: f.formulaExpression || "",
        options: f.configuration?.options?.length ? f.configuration.options : [{ value: "", label: "" }],
        scope: f.scope, classification: f.classification, fieldGroup: fieldGroupOf(f) || "",
      });
      setFieldForm(f.id);
    }
  };

  const formulaDeps = useMemo(() => {
    if (form.dataType !== "FORMULA" || !form.formula) return [];
    const codes = draft.filter((f) => (fieldForm === "new" ? true : f.id !== fieldForm)).map((f) => f.code);
    return codes.filter((c) => new RegExp(`\\b${c}\\b`).test(form.formula));
  }, [form.formula, form.dataType, draft, fieldForm]);

  const existingGroups = useMemo(() => {
    const seen = new Set();
    draft.forEach((f) => { const g = fieldGroupOf(f); if (g) seen.add(g); });
    return Array.from(seen);
  }, [draft]);

  // Groups fields by fieldGroup, preserving each field's relative order (§17 Field Groups).
  const groupedFields = useMemo(() => {
    if (groupBy !== "group") return null;
    const order = [];
    const buckets = new Map();
    draft.forEach((f) => {
      const g = fieldGroupOf(f) || NO_GROUP;
      if (!buckets.has(g)) { buckets.set(g, []); order.push(g); }
      buckets.get(g).push(f);
    });
    // Ungrouped fields last, regardless of where they first appeared.
    const ordered = order.includes(NO_GROUP) ? [...order.filter((g) => g !== NO_GROUP), NO_GROUP] : order;
    return ordered.map((g) => ({ group: g, fields: buckets.get(g) }));
  }, [draft, groupBy]);

  const submitFieldForm = () => {
    setFormError(null);
    if (!form.code.trim() || !form.label.trim()) { setFormError("Code et label sont obligatoires."); return; }
    if (form.dataType === "FORMULA" && !form.formula.trim()) { setFormError("Expression requise pour un champ FORMULA."); return; }

    const applyField = () => {
      if (fieldForm === "new") {
        mutate((d) => [...d, { ...form, id: `tmp_${Date.now()}`, _isNew: true, _dirty: false, position: d.length, version: 0, status: "ACTIVE" }]);
      } else {
        mutate((d) => d.map((f) => (f.id === fieldForm ? { ...f, ...form, _dirty: true } : f)));
      }
      setFieldForm(null);
    };

    // Specs §23 — changing the type of an already-persisted field is a structural change:
    // gate it on Impact Analysis (formulas/validations/constraints/indexes referencing it may break).
    if (fieldForm !== "new") {
      const original = draft.find((f) => f.id === fieldForm);
      if (original && !original._isNew && original.dataType !== form.dataType) {
        setPendingImpact({
          change: { kind: "FIELD_TYPE_CHANGE", fieldId: fieldForm, proposedType: form.dataType },
          title: `Changer le type de "${original.code}" : ${original.dataType} → ${form.dataType}`,
          run: applyField,
        });
        return;
      }
    }
    applyField();
  };

  const moveField = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= draft.length) return;
    mutate((d) => { const c = [...d]; [c[idx], c[j]] = [c[j], c[idx]]; return c; });
  };

  const archiveField = (f) => {
    // A brand-new, not-yet-saved field has no server-side dependents to analyze — just drop it locally.
    if (f._isNew) {
      mutate((d) => d.filter((x) => x.id !== f.id));
      return;
    }
    setPendingImpact({
      change: { kind: "FIELD_REMOVE", fieldId: f.id },
      title: `Archiver le champ "${f.code}"`,
      run: async () => {
        const res = await dm.archiveField(appId, versionId, entityId, f.id);
        if (!res.success) { window.alert(res.error?.message); return; }
        await load(); onChanged && onChanged();
      },
    });
  };

  // ---------- entity general ----------
  const saveEntity = async () => {
    setEntityError(null);
    const res = await dm.updateEntity(appId, versionId, entityId, { ...entityForm, expectedVersion: entity.version });
    if (!res.success) { setEntityError(res.error); return; }
    setEntity(res.data); onChanged && onChanged();
  };

  // ---------- relations ----------
  const submitRelation = async () => {
    const res = await dm.createRelation(appId, versionId, { ...relForm, sourceEntityId: entityId });
    if (!res.success) { window.alert(res.error?.message); return; }
    await load(); onChanged && onChanged();
  };
  const removeRelation = (id) => {
    setPendingImpact({
      change: { kind: "RELATION_REMOVE", relationId: id },
      title: "Supprimer cette relation",
      run: async () => {
        await dm.removeRelation(appId, versionId, id);
        await load(); onChanged && onChanged();
      },
    });
  };

  // ---------- constraints / indexes / validations ----------
  const submitConstraint = async () => {
    const res = await dm.saveConstraint(appId, versionId, { ...consForm, entityId });
    if (!res.success) { window.alert(res.error?.message); return; }
    await load(); onChanged && onChanged();
  };
  const submitIndex = async () => {
    const res = await dm.saveIndex(appId, versionId, { ...idxForm, entityId });
    if (!res.success) { window.alert(res.error?.message); return; }
    await load(); onChanged && onChanged();
  };
  const submitValidation = async () => {
    const configuration = {};
    if (valForm.type === "MIN" || valForm.type === "MAX") configuration.value = Number(valForm.minValue || 0);
    if (valForm.type === "MIN_LENGTH" || valForm.type === "MAX_LENGTH") configuration.value = Number(valForm.minValue || 0);
    if (valForm.type === "REGEX") configuration.pattern = valForm.pattern;
    const res = await dm.saveValidation(appId, versionId, { ...valForm, configuration, message: valForm.message || null });
    if (!res.success) { window.alert(res.error?.message); return; }
    await load(); onChanged && onChanged();
  };

  // ---------- dependencies ----------
  const loadDeps = async (type, id) => {
    const res = await dm.getDependenciesOf(appId, versionId, type, id);
    if (res.success) setDeps(res.data);
  };
  useEffect(() => {
    if (tab === "dependencies") loadDeps("ENTITY", entityId);
    // eslint-disable-next-line
  }, [tab]);

  if (!entity) return null;

  const statusColor = { CLEAN: "text-slate-400", DIRTY: "text-amber-600", SAVING: "text-blue-600", SAVED: "text-green-600", ERROR: "text-red-600", CONFLICT: "text-red-600" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{entity.name} <span className="font-mono text-xs text-slate-400">({entity.code})</span></h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className={`font-bold flex items-center gap-1 ${statusColor[saveStatus]}`}>
                  <CloudUpload className="w-3.5 h-3.5" />
                  {saveStatus === "CLEAN" ? "À jour" : saveStatus === "DIRTY" ? "Modifications non enregistrées" : saveStatus === "SAVING" ? "Enregistrement…" : saveStatus === "SAVED" ? "Enregistré" : saveStatus === "CONFLICT" ? "Conflit de version" : "Erreur"}
                </span>
                {readOnly && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">READ-ONLY</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === "fields" && !readOnly && (
              <>
                <button onClick={undo} disabled={!history.length} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" title="Annuler"><Undo2 className="w-4 h-4" /></button>
                <button onClick={redo} disabled={!future.length} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" title="Rétablir"><Redo2 className="w-4 h-4" /></button>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mr-1">
                  <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} className="rounded text-blue-600" /> Autosave
                </label>
                <button onClick={save} disabled={saveStatus === "SAVING" || saveStatus === "CLEAN"} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40">
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {saveStatus === "CONFLICT" && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> VERSION_CONFLICT : une autre session a modifié ce champ. Aucun écrasement silencieux.</span>
            <button onClick={load} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold"><RefreshCw className="w-3.5 h-3.5" /> Recharger</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-2.5 text-xs font-bold border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* GENERAL */}
          {tab === "general" && (
            <div className="max-w-xl space-y-3">
              {entityError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{entityError.code}: {entityError.message}</p>}
              {[["name", "Nom"], ["code", "Code technique"], ["pluralName", "Nom pluriel"]].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label>
                  <input disabled={readOnly} value={entityForm?.[k] || ""} onChange={(e) => setEntityForm({ ...entityForm, [k]: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50" />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Description</label>
                <textarea disabled={readOnly} rows={2} value={entityForm?.description || ""} onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })} className="w-full p-3 rounded-lg border border-slate-200 text-sm disabled:bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Scope</label>
                  <select disabled={readOnly} value={entityForm?.scope} onChange={(e) => setEntityForm({ ...entityForm, scope: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                    {["GLOBAL", "ORGANIZATION", "SITE", "USER", "CONTEXT"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Classification</label>
                  <select disabled={readOnly} value={entityForm?.classification} onChange={(e) => setEntityForm({ ...entityForm, classification: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                    {["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {!readOnly && (
                <button onClick={saveEntity} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><Save className="w-4 h-4" /> Enregistrer l'entité</button>
              )}
            </div>
          )}

          {/* FIELDS */}
          {tab === "fields" && (
            <div className="space-y-3">
              {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{formError}</p>}
              {!fieldForm && !readOnly && (
                <button onClick={() => openFieldForm("new")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><Plus className="w-4 h-4" /> Ajouter un champ</button>
              )}

              {fieldForm && (
                <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Code *</label>
                      <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} placeholder="selling_price" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Label *</label>
                      <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Prix de vente" className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Data Type</label>
                      <select value={form.dataType} onChange={(e) => setForm({ ...form, dataType: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm">
                        {dataTypes.map((t) => <option key={t.code} value={t.code}>{t.label} ({t.code})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Default value</label>
                      <input value={form.defaultValue} onChange={(e) => setForm({ ...form, defaultValue: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> Groupe de champs (optionnel)
                    </label>
                    <input
                      value={form.fieldGroup}
                      onChange={(e) => setForm({ ...form, fieldGroup: e.target.value })}
                      list="field-group-suggestions"
                      placeholder="ex: ADDRESS, PRICING…"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm"
                    />
                    <datalist id="field-group-suggestions">
                      {existingGroups.map((g) => <option key={g} value={g} />)}
                      {SUGGESTED_FIELD_GROUPS.filter((g) => !existingGroups.includes(g)).map((g) => <option key={g} value={g} />)}
                    </datalist>
                    <p className="text-[10px] text-slate-400 mt-1">Regroupe visuellement des champs liés (ex: ADDRESS = address_line, city, postal_code, country) — purement organisationnel, specs §17.</p>
                  </div>

                  {(form.dataType === "ENUM" || form.dataType === "MULTI_ENUM") && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Options ENUM (value stable / label affichable)</label>
                      <div className="space-y-1.5">
                        {form.options.map((o, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input value={o.value} onChange={(e) => { const c = [...form.options]; c[i] = { ...c[i], value: e.target.value }; setForm({ ...form, options: c }); }} placeholder="value" className="flex-1 h-8 px-2 rounded-lg border border-slate-200 text-xs font-mono" />
                            <input value={o.label} onChange={(e) => { const c = [...form.options]; c[i] = { ...c[i], label: e.target.value }; setForm({ ...form, options: c }); }} placeholder="label" className="flex-1 h-8 px-2 rounded-lg border border-slate-200 text-xs" />
                            <button onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => setForm({ ...form, options: [...form.options, { value: "", label: "" }] })} className="text-[11px] font-bold text-blue-600">+ Option</button>
                      </div>
                    </div>
                  )}

                  {form.dataType === "FORMULA" && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-500">Expression (DSL contrôlé : + - * / % , concat, round, min, max, coalesce)</label>
                      <textarea rows={2} value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="quantity * unit_price" className="w-full p-3 rounded-lg border border-slate-200 text-sm font-mono" />
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">Dépendances :</span>
                        {formulaDeps.length === 0 && <span className="text-slate-400">aucune</span>}
                        {formulaDeps.map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-mono font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{d}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">Les références, types et cycles sont vérifiés par le backend à l'enregistrement. Aucune exécution de code arbitraire.</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
                    {[["required", "Required"], ["unique", "Unique"], ["indexed", "Indexed"], ["readonly", "Readonly"]].map(([k, l]) => (
                      <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={!!form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="rounded text-blue-600" /> {l}</label>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button onClick={() => setFieldForm(null)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">Annuler</button>
                    <button onClick={submitFieldForm} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Appliquer</button>
                  </div>
                </div>
              )}

              {/* Group by toggle — specs §17 Field Groups */}
              {draft.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Affichage :</span>
                  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setGroupBy("none")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold ${groupBy === "none" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <LayoutList className="w-3.5 h-3.5" /> Liste
                    </button>
                    <button
                      onClick={() => setGroupBy("group")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold border-l border-slate-200 ${groupBy === "group" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Par groupe
                    </button>
                  </div>
                  {groupBy === "group" && <span className="text-[11px] text-slate-400">Réordonnez depuis la vue « Liste ».</span>}
                </div>
              )}

              {/* Field rows */}
              {groupBy === "group" && groupedFields ? (
                <div className="space-y-4">
                  {groupedFields.map(({ group, fields: groupFields }) => (
                    <div key={group} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
                          {group === NO_GROUP ? "Sans groupe" : group}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">({groupFields.length})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {groupFields.map((f) => (
                          <FieldRow key={f.id} f={f} showArrows={false} readOnly={readOnly} onMove={moveField} onEdit={openFieldForm} onArchive={archiveField} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {draft.map((f, i) => (
                    <FieldRow key={f.id} f={f} index={i} showArrows readOnly={readOnly} onMove={moveField} onEdit={openFieldForm} onArchive={archiveField} />
                  ))}
                  {draft.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Aucun champ. Ajoutez le premier champ de cette entité.</p>}
                </div>
              )}
            </div>
          )}

          {/* RELATIONS */}
          {tab === "relations" && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Entité cible</label>
                    <select value={relForm.targetEntityId} onChange={(e) => setRelForm({ ...relForm, targetEntityId: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      <option value="">— choisir —</option>
                      {entities.filter((e) => e.id !== entityId && e.status === "ACTIVE").map((e) => <option key={e.id} value={e.id}>{e.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                    <select value={relForm.relationType} onChange={(e) => setRelForm({ ...relForm, relationType: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">On delete</label>
                    <select value={relForm.deleteBehavior} onChange={(e) => setRelForm({ ...relForm, deleteBehavior: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {["RESTRICT", "CASCADE", "SET_NULL"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 h-9"><input type="checkbox" checked={relForm.required} onChange={(e) => setRelForm({ ...relForm, required: e.target.checked })} className="rounded text-blue-600" /> Required</label>
                  <button onClick={submitRelation} className="h-9 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1"><Link2 className="w-3.5 h-3.5" /> Créer</button>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {relations.map((r) => {
                  const isSource = r.sourceEntityId === entityId;
                  const other = entities.find((e) => e.id === (isSource ? r.targetEntityId : r.sourceEntityId));
                  return (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-bold text-slate-800">{entity.code}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700">{r.relationType.replace("ONE_TO_", "1:").replace("MANY_TO_", "N:")}</span>
                        <span className="font-mono font-bold text-slate-800">{other?.code || "?"}</span>
                        <span className="text-[10px] text-slate-400 ml-2">on delete: <strong>{r.deleteBehavior}</strong>{r.deleteBehavior === "CASCADE" && <span className="text-amber-600 ml-1">⚠</span>}</span>
                      </div>
                      {!readOnly && <button onClick={() => removeRelation(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  );
                })}
                {relations.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Aucune relation pour cette entité.</p>}
              </div>
            </div>
          )}

          {/* CONSTRAINTS */}
          {tab === "constraints" && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                    <select value={consForm.type} onChange={(e) => setConsForm({ ...consForm, type: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {["UNIQUE", "NOT_NULL", "VALUE_RANGE", "FORMAT", "COMPOSITE_UNIQUE"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Nom</label>
                    <input value={consForm.name} onChange={(e) => setConsForm({ ...consForm, name: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Champs</label>
                    <select multiple value={consForm.fieldIds} onChange={(e) => setConsForm({ ...consForm, fieldIds: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {serverFields.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                    </select>
                  </div>
                  <button onClick={submitConstraint} className="h-9 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Ajouter</button>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {constraints.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span><strong className="text-slate-800">{c.name}</strong> <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 ml-1">{c.type}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">{(c.fieldIds || []).map((id) => serverFields.find((f) => f.id === id)?.code).filter(Boolean).join(", ")}</span>
                    </span>
                    {!readOnly && <button onClick={async () => { await dm.saveConstraint(appId, versionId, { action: "remove", id: c.id }); await load(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                {constraints.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Aucune contrainte.</p>}
              </div>
            </div>
          )}

          {/* INDEXES */}
          {tab === "indexes" && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Type</label>
                    <select value={idxForm.type} onChange={(e) => setIdxForm({ ...idxForm, type: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {["SIMPLE", "UNIQUE", "COMPOSITE"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Nom</label>
                    <input value={idxForm.name} onChange={(e) => setIdxForm({ ...idxForm, name: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Champs</label>
                    <select multiple value={idxForm.fieldIds} onChange={(e) => setIdxForm({ ...idxForm, fieldIds: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {serverFields.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                    </select>
                  </div>
                  <button onClick={submitIndex} className="h-9 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1"><ListOrdered className="w-3.5 h-3.5" /> Ajouter</button>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {indexes.map((ix) => (
                  <div key={ix.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span><strong className="text-slate-800 font-mono">{ix.name}</strong> <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 ml-1">{ix.type}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">{(ix.fieldIds || []).map((id) => serverFields.find((f) => f.id === id)?.code).filter(Boolean).join(", ")}</span>
                    </span>
                    {!readOnly && <button onClick={async () => { await dm.saveIndex(appId, versionId, { action: "remove", id: ix.id }); await load(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                {indexes.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Aucun index.</p>}
              </div>
            </div>
          )}

          {/* VALIDATION */}
          {tab === "validation" && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Champ</label>
                    <select value={valForm.fieldId} onChange={(e) => setValForm({ ...valForm, fieldId: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      <option value="">—</option>
                      {serverFields.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Règle</label>
                    <select value={valForm.type} onChange={(e) => setValForm({ ...valForm, type: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs">
                      {["REQUIRED", "MIN", "MAX", "MIN_LENGTH", "MAX_LENGTH", "REGEX", "EMAIL", "URL"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Valeur / min / longueur</label>
                    <input value={valForm.minValue} onChange={(e) => setValForm({ ...valForm, minValue: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pattern (REGEX)</label>
                    <input value={valForm.pattern} onChange={(e) => setValForm({ ...valForm, pattern: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-mono" />
                  </div>
                  <button onClick={submitValidation} className="h-9 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Ajouter</button>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {validations.map((v) => {
                  const f = serverFields.find((x) => x.id === v.fieldId);
                  return (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-mono text-slate-700">{f?.code}<span className="text-slate-400"> → </span><strong className="text-blue-700">{v.type}</strong>
                        <span className="text-xs text-slate-400 ml-2">{JSON.stringify(v.configuration || {})}</span>
                      </span>
                      {!readOnly && <button onClick={async () => { await dm.saveValidation(appId, versionId, { action: "remove", id: v.id }); await load(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  );
                })}
                {validations.length === 0 && <p className="p-6 text-center text-xs text-slate-400">Aucune règle de validation déclarative.</p>}
              </div>
            </div>
          )}

          {/* DEPENDENCIES */}
          {tab === "dependencies" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-500">Analyser :</label>
                <select value={depFieldId} onChange={(e) => { setDepFieldId(e.target.value); if (e.target.value) loadDeps("FIELD", e.target.value); else loadDeps("ENTITY", entityId); }} className="h-9 px-2 rounded-lg border border-slate-200 text-xs">
                  <option value="">Entité {entity.code}</option>
                  {serverFields.map((f) => <option key={f.id} value={f.id}>Champ {f.code}</option>)}
                </select>
              </div>
              {deps && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-extrabold text-slate-700 mb-2">Dépendances entrantes (consommateurs)</p>
                    {deps.incoming.length === 0 && <p className="text-xs text-slate-400">Aucun consommateur enregistré.</p>}
                    {deps.incoming.map((d, i) => (
                      <p key={i} className="text-xs text-slate-600 py-1 flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 text-blue-500" /><span className="font-mono">{d.label}</span><span className="text-[10px] text-slate-400">{d.dependencyType}</span></p>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-extrabold text-slate-700 mb-2">Dépendances sortantes</p>
                    {deps.outgoing.length === 0 && <p className="text-xs text-slate-400">Aucune.</p>}
                    {deps.outgoing.map((d, i) => (
                      <p key={i} className="text-xs text-slate-600 py-1 flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 text-violet-500" /><span className="font-mono">{d.label}</span><span className="text-[10px] text-slate-400">{d.dependencyType}</span></p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ImpactAnalysisModal
        appId={appId}
        versionId={versionId}
        change={pendingImpact?.change}
        title={pendingImpact?.title}
        onCancel={() => setPendingImpact(null)}
        onConfirm={async () => {
          await pendingImpact.run();
          setPendingImpact(null);
        }}
      />
    </div>
  );
}
