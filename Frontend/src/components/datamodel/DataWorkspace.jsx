"use client";

import React, { useState, useEffect } from "react";
import {
  Database, Boxes, Link2, GitBranch, Network, BadgeCheck, GitCompare, Rocket, Plus, Search,
  Copy, Archive, Pencil, Download, Loader2, AlertTriangle, CheckCircle2, XCircle, Sparkles,
  ShieldAlert, Info, ArrowRight, Lock,
} from "lucide-react";
import { dm, api } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconRenderer } from "@/components/ui/IconRenderer";
import { SchemaViewer } from "./SchemaViewer";
import { EntityEditor } from "./EntityEditor";

const SUB_TABS = [
  { key: "overview", label: "Overview", icon: Database },
  { key: "entities", label: "Entities", icon: Boxes },
  { key: "relations", label: "Relations", icon: Link2 },
  { key: "schema", label: "Schema", icon: GitBranch },
  { key: "dependencies", label: "Dependencies", icon: Network },
  { key: "validation", label: "Validation", icon: BadgeCheck },
  { key: "changes", label: "Changes", icon: GitCompare },
  { key: "migration", label: "Migration", icon: Rocket },
];

const RISK_STYLE = {
  SAFE: "bg-green-50 text-green-700 border-green-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  BREAKING: "bg-red-50 text-red-700 border-red-200",
  DATA_LOSS_RISK: "bg-rose-100 text-rose-800 border-rose-300",
};

export function DataWorkspace({ appId, versionId, tab, app, versions, navigate }) {
  const [entities, setEntities] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editorEntityId, setEditorEntityId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ code: "", name: "", pluralName: "", description: "", scope: "ORGANIZATION" });
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [changes, setChanges] = useState(null);
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [migration, setMigration] = useState(null);
  const [depObject, setDepObject] = useState("");
  const [deps, setDeps] = useState(null);

  const readOnly = app?.status === "PUBLISHED" || app?.status === "SUPERSEDED";
  const publishedVersion = versions.find((v) => v.id === app?.publishedVersionId);

  const load = async () => {
    if (!appId || !versionId) return;
    setLoading(true);
    const [e, r] = await Promise.all([dm.listEntities(appId, versionId, search || undefined), dm.listRelations(appId, versionId)]);
    let ents = e.success ? e.data : [];
    if (r.success) {
      // attach fields for schema viewer
      const withFields = await Promise.all(ents.map(async (ent) => {
        const f = await dm.listFields(appId, versionId, ent.id);
        return { ...ent, _fields: f.success ? f.data : [] };
      }));
      ents = withFields;
    }
    setEntities(ents);
    setRelations(r.success ? r.data : []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [appId, versionId, search]);
  useEffect(() => {
    if (appId && versionId) dm.listTemplates(appId, versionId).then((t) => t.success && setTemplates(t.data));
    setValidation(null); setChanges(null); setMigration(null); setDeps(null);
  }, [appId, versionId]);

  const totalFields = entities.reduce((n, e) => n + (e.fieldsCount || e._fields?.length || 0), 0);

  const createEntity = async () => {
    const res = await dm.createEntity(appId, versionId, createForm);
    if (!res.success) { window.alert(res.error?.message); return; }
    setCreateOpen(false);
    setCreateForm({ code: "", name: "", pluralName: "", description: "", scope: "ORGANIZATION" });
    await load();
    setEditorEntityId(res.data.id);
  };

  const duplicateEntity = async (id) => { await dm.duplicateEntity(appId, versionId, id); await load(); };
  const archiveEntity = async (id) => { if (!window.confirm("Archiver cette entité ?")) return; await dm.archiveEntity(appId, versionId, id); await load(); };

  const runValidation = async () => {
    setValidating(true);
    const res = await dm.validateSchema(appId, versionId);
    if (res.success) setValidation(res.data);
    setValidating(false);
  };

  const runChanges = async () => {
    const res = await dm.getChanges(appId, versionId, publishedVersion?.id);
    if (res.success) setChanges(res.data);
  };

  const runMigration = async () => {
    if (!publishedVersion) { window.alert("Aucune version publiée de référence pour générer un plan."); return; }
    const res = await dm.createMigrationPlan(appId, versionId, publishedVersion.id);
    if (res.success) setMigration(res.data);
    else window.alert(res.error?.message);
  };

  const runDeps = async () => {
    if (!depObject) return;
    const [type, id] = depObject.split(":");
    const res = await dm.getDependenciesOf(appId, versionId, type, id);
    if (res.success) setDeps(res.data);
  };

  const exportSchema = async () => {
    const res = await dm.exportSchema(appId, versionId);
    if (!res.success) return;
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${app?.code || "schema"}-datamodel.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const createDraftFromPublished = async () => {
    const res = await api.createVersion(appId, { versionNumber: bumpVersion(app), sourceVersionId: versionId, comment: "Évolution du Data Model" });
    if (res.success && res.data) navigate({ version: res.data.id });
  };

  const bumpVersion = (a) => {
    const v = a?.publishedVersionNumber || a?.currentVersionNumber || "1.0.0";
    const [ma, mi] = v.split(".").map(Number);
    return `${ma}.${(mi || 0) + 1}.0`;
  };

  const filteredChanges = changes?.changes?.filter((c) => riskFilter === "ALL" || c.riskLevel === riskFilter) || [];

  return (
    <div className="space-y-5">
      {/* Read-only banner */}
      {readOnly && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-800 flex items-center gap-2"><Lock className="w-4 h-4" /> Version <strong className="font-mono">v{app?.versionNumberForBanner || publishedVersion?.versionNumber}</strong> publiée : Data Model immuable (read-only). Toute évolution se prépare dans une nouvelle version DRAFT.</p>
          <button onClick={createDraftFromPublished} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 self-start"><Plus className="w-4 h-4" /> Créer une version DRAFT</button>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => navigate({ tab: t.key })} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <button onClick={exportSchema} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Entities", value: entities.filter((e) => e.status === "ACTIVE").length, icon: Boxes, color: "text-blue-600 bg-blue-50" },
                  { label: "Fields", value: totalFields, icon: Database, color: "text-violet-600 bg-violet-50" },
                  { label: "Relations", value: relations.length, icon: Link2, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Statut schéma", value: validation ? (validation.valid ? "VALID" : `${validation.errors.length} ERR`) : "—", icon: BadgeCheck, color: validation ? (validation.valid ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50") : "text-slate-500 bg-slate-100" },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}><Icon className="w-5 h-5" /></div>
                      <div>
                        <p className="text-2xl font-black text-slate-900">{c.value}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Validation du schéma</h3>
                    <button onClick={runValidation} disabled={validating} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                      {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />} Valider
                    </button>
                  </div>
                  {validation ? (
                    <div className={`p-4 rounded-lg border ${validation.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-sm font-black ${validation.valid ? "text-green-800" : "text-red-800"}`}>{validation.valid ? "SCHEMA VALID" : "SCHEMA INVALID"}</p>
                      <p className="text-xs text-slate-600 mt-1">{validation.errors.length} erreurs • {validation.warnings.length} avertissements • {validation.infos.length} infos</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">hash: {validation.schemaHash}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Lancez la validation backend pour contrôler le modèle.</p>
                  )}
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Templates réutilisables</h3>
                    <button onClick={() => setShowTemplates(!showTemplates)} disabled={readOnly} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Sparkles className="w-3.5 h-3.5" /> Appliquer</button>
                  </div>
                  {showTemplates && (
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                          <div><p className="text-xs font-bold text-slate-800">{t.name}</p><p className="text-[11px] text-slate-400">{t.description}</p></div>
                          <button onClick={async () => { await dm.applyTemplate(appId, versionId, t.id); setShowTemplates(false); await load(); }} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold">Appliquer</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {!showTemplates && <p className="text-xs text-slate-400">Customer, Product, Address, Audit Fields… appliqués en un clic dans la version DRAFT.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ENTITIES */}
          {tab === "entities" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une entité…" className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 text-sm" />
                </div>
                {!readOnly && (
                  <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><Plus className="w-4 h-4" /> Nouvelle entité</button>
                )}
              </div>

              <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
                {entities.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><IconRenderer name={e.icon} className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{e.name} <span className="text-[10px] text-slate-400 font-mono">({e.code})</span></p>
                      <p className="text-[11px] text-slate-400">{e.fieldsCount || 0} champs • scope {e.scope} {e.status === "ARCHIVED" && "• ARCHIVÉE"}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">{e.scope}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditorEntityId(e.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="w-3.5 h-3.5" /> Ouvrir</button>
                      {!readOnly && e.status === "ACTIVE" && (
                        <>
                          <button onClick={() => duplicateEntity(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600" title="Dupliquer"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => archiveEntity(e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600" title="Archiver"><Archive className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {entities.length === 0 && (
                  <div className="p-10 text-center space-y-2">
                    <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-600">Aucune entité dans cette version</p>
                    <p className="text-xs text-slate-400">Créez votre première entité métier ou appliquez un template.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RELATIONS */}
          {tab === "relations" && (
            <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
              {relations.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-bold text-slate-800">{r.sourceEntity?.code}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700">{r.relationType.replace("ONE_TO_", "1:").replace("MANY_TO_", "N:")}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-mono font-bold text-slate-800">{r.targetEntity?.code}</span>
                    <span className="text-[11px] text-slate-400 ml-3">on delete <strong>{r.deleteBehavior}</strong>{r.deleteBehavior === "CASCADE" && <span className="text-amber-600 ml-1">⚠ dangereux</span>}</span>
                  </div>
                  <button onClick={() => setEditorEntityId(r.sourceEntityId)} className="text-[11px] font-bold text-blue-600">Configurer</button>
                </div>
              ))}
              {relations.length === 0 && <p className="p-10 text-center text-xs text-slate-400">Aucune relation. Créez-les depuis l'éditeur d'entité (onglet Relations).</p>}
            </div>
          )}

          {/* SCHEMA */}
          {tab === "schema" && (
            <SchemaViewer entities={entities} relations={relations} onOpenEntity={(id) => setEditorEntityId(id)} />
          )}

          {/* DEPENDENCIES */}
          {tab === "dependencies" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Objet :</label>
                <select value={depObject} onChange={(e) => setDepObject(e.target.value)} className="h-9 px-2 rounded-lg border border-slate-200 text-xs">
                  <option value="">— choisir —</option>
                  {entities.map((e) => (
                    <optgroup key={e.id} label={e.code}>
                      <option value={`ENTITY:${e.id}`}>Entité {e.code}</option>
                      {(e._fields || []).map((f) => <option key={f.id} value={`FIELD:${f.id}`}>Champ {f.code}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button onClick={runDeps} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">Analyser</button>
              </div>
              {deps && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <p className="text-xs font-extrabold text-slate-700 mb-2">Consommateurs (incoming)</p>
                    {deps.incoming.length === 0 && <p className="text-xs text-slate-400">Rien ne dépend de cet objet.</p>}
                    {deps.incoming.map((d, i) => <p key={i} className="text-xs py-1 font-mono text-slate-600">{d.label} <span className="text-slate-400">({d.dependencyType})</span></p>)}
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <p className="text-xs font-extrabold text-slate-700 mb-2">Dépend de (outgoing)</p>
                    {deps.outgoing.length === 0 && <p className="text-xs text-slate-400">Aucune dépendance sortante.</p>}
                    {deps.outgoing.map((d, i) => <p key={i} className="text-xs py-1 font-mono text-slate-600">{d.label} <span className="text-slate-400">({d.dependencyType})</span></p>)}
                  </div>
                </div>
              )}
              {!deps && <p className="text-xs text-slate-400">Sélectionnez un champ ou une entité pour visualiser son graphe de dépendances.</p>}
            </div>
          )}

          {/* VALIDATION */}
          {tab === "validation" && (
            <div className="space-y-4">
              <button onClick={runValidation} disabled={validating} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />} Lancer la validation backend
              </button>
              {validation && (
                <>
                  <div className={`p-4 rounded-xl border ${validation.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <p className={`font-black ${validation.valid ? "text-green-800" : "text-red-800"}`}>{validation.valid ? "VALID" : "INVALID"}</p>
                    <p className="text-xs text-slate-600">{validation.errors.length} erreurs • {validation.warnings.length} warnings • {validation.infos.length} infos • hash {validation.schemaHash}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
                    {[...validation.errors, ...validation.warnings, ...validation.infos].map((iss, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3">
                        {iss.severity === "ERROR" ? <XCircle className="w-4 h-4 text-red-500 mt-0.5" /> : iss.severity === "WARNING" ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" /> : <Info className="w-4 h-4 text-blue-400 mt-0.5" />}
                        <div>
                          <p className="text-xs font-bold text-slate-800">{iss.message}</p>
                          <p className="text-[10px] font-mono text-slate-400">{iss.code} • {iss.object_type} {iss.path || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* CHANGES */}
          {tab === "changes" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={runChanges} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><GitCompare className="w-4 h-4" /> Comparer avec v{publishedVersion?.versionNumber || "—"}</button>
                {changes && ["ALL", "SAFE", "WARNING", "BREAKING", "DATA_LOSS_RISK"].map((r) => (
                  <button key={r} onClick={() => setRiskFilter(r)} className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${riskFilter === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>
                    {r === "ALL" ? `All (${changes.changes.length})` : r}
                  </button>
                ))}
              </div>
              {changes && (
                <div className="rounded-xl bg-white border border-slate-200 divide-y divide-slate-100">
                  {filteredChanges.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{c.type} <span className="font-mono text-slate-500">{c.after?.code || c.before?.code || ""}</span></p>
                        <p className="text-[11px] text-slate-400">{c.objectType} • {JSON.stringify(c.before || {})} → {JSON.stringify(c.after || {})}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded border ${RISK_STYLE[c.riskLevel]}`}>{c.riskLevel}</span>
                    </div>
                  ))}
                  {filteredChanges.length === 0 && <p className="p-8 text-center text-xs text-slate-400">Aucun changement pour ce filtre.</p>}
                </div>
              )}
              {!changes && <p className="text-xs text-slate-400">Le diff compare la version DRAFT courante avec la version publiée de référence (détection de renommage par IDs stables).</p>}
            </div>
          )}

          {/* MIGRATION */}
          {tab === "migration" && (
            <div className="space-y-4">
              <button onClick={runMigration} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><Rocket className="w-4 h-4" /> Générer le plan de migration</button>
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
                    <div className="p-4 rounded-xl border border-slate-200 bg-white text-center"><p className={`text-lg font-black ${migration.status === "READY" ? "text-green-600" : migration.status === "BLOCKED" ? "text-red-600" : "text-amber-600"}`}>{migration.status}</p><p className="text-[10px] font-bold uppercase text-slate-400">Statut</p></div>
                  </div>
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
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Create entity modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">Nouvelle entité</h3>
            {[["code", "Code technique *", "product"], ["name", "Nom affiché *", "Produit"], ["pluralName", "Nom pluriel", "Produits"]].map(([k, l, ph]) => (
              <div key={k}>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label>
                <input value={createForm[k]} onChange={(e) => setCreateForm({ ...createForm, [k]: k === "code" ? e.target.value.toLowerCase() : e.target.value })} placeholder={ph} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Scope</label>
              <select value={createForm.scope} onChange={(e) => setCreateForm({ ...createForm, scope: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                {["GLOBAL", "ORGANIZATION", "SITE", "USER", "CONTEXT"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <p className="text-[10px] text-slate-400">Format du code : ^[a-z][a-z0-9_]*$ — unique dans la version.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">Annuler</button>
              <button onClick={createEntity} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Entity editor */}
      {editorEntityId && (
        <EntityEditor
          appId={appId}
          versionId={versionId}
          entityId={editorEntityId}
          entities={entities}
          readOnly={readOnly}
          onClose={() => setEditorEntityId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
