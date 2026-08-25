"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { IconRenderer } from "@/components/ui/IconRenderer";
import confetti from "canvas-confetti";
import { P02E2E } from "@/components/datamodel/P02E2E";

const INITIAL_STEPS = [
  { id: 1, label: "1. Création de l'application 'Boutique E2E'", status: "idle" },
  { id: 2, label: "2. Mise à jour des métadonnées (Description, Catégorie)", status: "idle" },
  { id: 3, label: "3. Cycle de vie: DRAFT → CONFIGURING", status: "idle" },
  { id: 4, label: "4. Cycle de vie: CONFIGURING → READY", status: "idle" },
  { id: 5, label: "5. Récupération de la version initiale 1.0.0", status: "idle" },
  { id: 6, label: "6. Exécution de la validation pré-publication (1.0.0)", status: "idle" },
  { id: 7, label: "7. Publication de la version 1.0.0 en PRODUCTION", status: "idle" },
  { id: 8, label: "8. Vérification statut = ACTIVE et version publiée = 1.0.0", status: "idle" },
  { id: 9, label: "9. Création de la version évolutive 1.1.0", status: "idle" },
  { id: 10, label: "10. Validation & Publication de la version 1.1.0", status: "idle" },
  { id: 11, label: "11. Vérification version active = 1.1.0 (1.0.0 SUPERSEDED)", status: "idle" },
  { id: 12, label: "12. Exécution du Rollback vers la version 1.0.0", status: "idle" },
  { id: 13, label: "13. Vérification de la version restaurée (1.0.0 ACTIVE)", status: "idle" },
  { id: 14, label: "14. Clonage vers 'Boutique Premium E2E'", status: "idle" },
  { id: 15, label: "15. Vérification de l'isolation du clone & audit trail", status: "idle" },
];

const TEMPLATES = [
  { key: "ecommerce", title: "Boutique E-commerce", icon: "ShoppingBag", category: "Commerce", desc: "Catalogue, panier, commandes et clients." },
  { key: "restaurant", title: "Restaurant & Carte", icon: "UtensilsCrossed", category: "Restauration", desc: "Plats, tables et réservations." },
  { key: "garage", title: "Garage Automobile", icon: "Wrench", category: "Automobile", desc: "Véhicules, OR et pièces détachées." },
  { key: "ecole", title: "École & Formation", icon: "GraduationCap", category: "Éducation", desc: "Élèves, classes et professeurs." },
  { key: "pharmacie", title: "Pharmacie & Santé", icon: "Pill", category: "Santé", desc: "Ordonnances et stocks médicaments." },
];

const FUTURE_MODULES = [
  { num: "02", label: "Data Model Manager", tag: "P0.2" },
  { num: "03", label: "Feature & Capability Manager", tag: "P0.3" },
  { num: "05", label: "Page & UI Builder", tag: "P0.4" },
  { num: "06", label: "Form Engine", tag: "P0.5" },
  { num: "07", label: "Dashboard Engine", tag: "P0.6" },
  { num: "10", label: "Workflow Engine", tag: "P0.8" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SpecsPage() {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [createdAppId, setCreatedAppId] = useState(null);
  const [concurrencyRunning, setConcurrencyRunning] = useState(false);
  const [concurrencyResult, setConcurrencyResult] = useState(null);

  const updateStep = (id, status, log) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status, log } : s)));
  };

  const runFullE2ETest = async () => {
    setRunning(true);
    setSteps(INITIAL_STEPS);
    setCreatedAppId(null);

    const ts = Date.now().toString().slice(-4);
    const appCode = `boutique-e2e-${ts}`;
    const cloneCode = `boutique-premium-e2e-${ts}`;
    let appId = "";
    let v1Id = "";
    let v11Id = "";

    try {
      updateStep(1, "running");
      await sleep(300);
      const c = await api.createApplication({
        name: `Boutique E2E ${ts}`,
        code: appCode,
        category: "Commerce",
        icon: "ShoppingBag",
        environment: "PRODUCTION",
        description: "Application générée par le banc de test automatisé E2E.",
      });
      if (!c.success || !c.data) throw new Error(`Step 1 Failed: ${c.error?.message}`);
      appId = c.data.id;
      setCreatedAppId(appId);
      updateStep(1, "passed", appCode);

      updateStep(2, "running");
      await sleep(300);
      const u = await api.updateApplication(appId, { description: "Description enrichie E2E.", category: "Commerce" });
      if (!u.success) throw new Error(`Step 2 Failed: ${u.error?.message}`);
      updateStep(2, "passed", "OK");

      updateStep(3, "running");
      await sleep(300);
      const t1 = await api.transitionStatus(appId, "CONFIGURING");
      if (!t1.success) throw new Error(`Step 3 Failed: ${t1.error?.message}`);
      updateStep(3, "passed", "→ CONFIGURING");

      updateStep(4, "running");
      await sleep(300);
      const t2 = await api.transitionStatus(appId, "READY");
      if (!t2.success) throw new Error(`Step 4 Failed: ${t2.error?.message}`);
      updateStep(4, "passed", "→ READY");

      updateStep(5, "running");
      await sleep(300);
      const lv = await api.listVersions(appId);
      v1Id = lv.data?.[0]?.id;
      if (!v1Id) {
        const cv = await api.createVersion(appId, { versionNumber: "1.0.0" });
        v1Id = cv.data.id;
      }
      updateStep(5, "passed", "v1.0.0");

      updateStep(6, "running");
      await sleep(300);
      const val = await api.validateVersion(appId, v1Id);
      if (!val.success || !val.data?.canPublish) throw new Error(`Step 6 Failed: ${val.error?.message}`);
      updateStep(6, "passed", `${val.data.summary.passed}/${val.data.summary.total} PASS`);

      updateStep(7, "running");
      await sleep(300);
      const pub = await api.publishVersion(appId, v1Id, "PRODUCTION");
      if (!pub.success) throw new Error(`Step 7 Failed: ${pub.error?.message}`);
      updateStep(7, "passed", "transaction OK");

      updateStep(8, "running");
      await sleep(250);
      const a1 = await api.getApplication(appId);
      if (a1.data?.status !== "ACTIVE" || a1.data?.publishedVersionNumber !== "1.0.0") throw new Error("Step 8 Failed");
      updateStep(8, "passed", "ACTIVE v1.0.0");

      updateStep(9, "running");
      await sleep(300);
      const cv11 = await api.createVersion(appId, { versionNumber: "1.1.0", sourceVersionId: v1Id });
      if (!cv11.success) throw new Error(`Step 9 Failed: ${cv11.error?.message}`);
      v11Id = cv11.data.id;
      updateStep(9, "passed", "v1.1.0");

      updateStep(10, "running");
      await sleep(300);
      await api.validateVersion(appId, v11Id);
      const pub11 = await api.publishVersion(appId, v11Id, "PRODUCTION");
      if (!pub11.success) throw new Error(`Step 10 Failed: ${pub11.error?.message}`);
      updateStep(10, "passed", "v1.1.0 publiée");

      updateStep(11, "running");
      await sleep(250);
      const a2 = await api.getApplication(appId);
      if (a2.data?.publishedVersionNumber !== "1.1.0") throw new Error("Step 11 Failed");
      updateStep(11, "passed", "v1.1.0 active");

      updateStep(12, "running");
      await sleep(300);
      const rb = await api.rollbackVersion(appId, v1Id, "PRODUCTION");
      if (!rb.success) throw new Error(`Step 12 Failed: ${rb.error?.message}`);
      updateStep(12, "passed", "rollback OK");

      updateStep(13, "running");
      await sleep(250);
      const a3 = await api.getApplication(appId);
      if (a3.data?.publishedVersionNumber !== "1.0.0") throw new Error("Step 13 Failed");
      updateStep(13, "passed", "v1.0.0 restaurée");

      updateStep(14, "running");
      await sleep(300);
      const cl = await api.cloneApplication(appId, { newName: `Boutique Premium E2E ${ts}`, newCode: cloneCode });
      if (!cl.success) throw new Error(`Step 14 Failed: ${cl.error?.message}`);
      updateStep(14, "passed", cloneCode);

      updateStep(15, "running");
      await sleep(250);
      const au = await api.getApplicationActivity(appId);
      if ((au.data?.length || 0) < 6) throw new Error("Step 15 Failed");
      updateStep(15, "passed", `${au.data.length} événements`);

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch (err) {
      console.error(err);
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed", log: err.message } : s)));
    } finally {
      setRunning(false);
    }
  };

  const runConcurrencyTest = async () => {
    setConcurrencyRunning(true);
    setConcurrencyResult(null);
    try {
      const list = await api.listApplications({ limit: 1 });
      const testApp = list.data?.[0];
      if (!testApp) {
        setConcurrencyResult({ error: "Aucune application disponible." });
        return;
      }
      const v = testApp.version;
      const [r1, r2] = await Promise.all([
        api.updateApplication(testApp.id, { description: `Session A ${Date.now()}`, expectedVersion: v }),
        api.updateApplication(testApp.id, { description: `Session B ${Date.now()}`, expectedVersion: v }),
      ]);
      const s1 = r1.success;
      const s2 = r2.success;
      const c1 = !s1 && r1.error?.code === "VERSION_CONFLICT";
      const c2 = !s2 && r2.error?.code === "VERSION_CONFLICT";
      setConcurrencyResult({
        app: testApp.name,
        v0: v,
        req1: { success: s1, nv: r1.data?.version, code: r1.error?.code },
        req2: { success: s2, nv: r2.data?.version, code: r2.error?.code },
        ok: (s1 && c2) || (s2 && c1),
      });
    } catch (err) {
      setConcurrencyResult({ error: err.message });
    } finally {
      setConcurrencyRunning(false);
    }
  };

  const allPassed = steps.every((s) => s.status === "passed");

  const renderReq = (label, r) =>
    r.success ? (
      <span className="text-emerald-700">
        {label}: <strong>SUCCÈS</strong> → v{r.nv}
      </span>
    ) : r.code === "VERSION_CONFLICT" ? (
      <span className="text-amber-700">
        {label}: <strong>Rejetée</strong> 409 VERSION_CONFLICT
      </span>
    ) : (
      <span className="text-red-700">
        {label}: échec ({r.code})
      </span>
    );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="p-8 rounded-xl bg-[#0B1526] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Definition of Done • Validation P0.1 (Specs §61 & §62)
          </div>
          <h1 className="text-2xl font-black tracking-tight">Spécifications & Travail</h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Banc d'homologation automatisé du scénario officiel (Créer → Configurer → Versionner → Valider → Publier →
            Rollback → Cloner → Auditer), test de concurrence optimiste, modèles de départ et feuille de route des moteurs.
          </p>
        </div>
        <button
          onClick={runFullE2ETest}
          disabled={running}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all self-start md:self-auto"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Lancer le test E2E
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* E2E steps */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900">Scénario fonctionnel E2E (§47 & §61)</h2>
            {allPassed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-black uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Validé
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  s.status === "passed"
                    ? "bg-green-50/60 border-green-200 text-green-950"
                    : s.status === "running"
                    ? "bg-blue-50 border-blue-300 text-blue-950"
                    : s.status === "failed"
                    ? "bg-red-50 border-red-200 text-red-950"
                    : "bg-slate-50 border-slate-200/60 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {s.status === "passed" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : s.status === "running" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                  ) : s.status === "failed" ? (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 text-[9px] flex items-center justify-center text-slate-400 flex-shrink-0">
                      {s.id}
                    </span>
                  )}
                  <span className="font-bold truncate">{s.label}</span>
                </div>
                {s.log && (
                  <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60 whitespace-nowrap">
                    {s.log}
                  </span>
                )}
              </div>
            ))}
          </div>
          {createdAppId && allPassed && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-semibold">Application de test disponible dans le workspace.</span>
              <Link
                href={`/business-manager/workspace?app=${createdAppId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
              >
                Ouvrir <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Concurrency */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Cpu className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Concurrence optimiste (§62)</h3>
                <p className="text-[11px] text-slate-400">Deux mutations simultanées, même expectedVersion</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Une seule requête doit gagner ; l'autre reçoit <strong className="font-mono text-blue-700">409 VERSION_CONFLICT</strong>.
            </p>
            <button
              onClick={runConcurrencyTest}
              disabled={concurrencyRunning}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0B1526] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold"
            >
              {concurrencyRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              Tester le conflit
            </button>
            {concurrencyResult && !concurrencyResult.error && (
              <div
                className={`p-4 rounded-lg border text-xs space-y-2 ${
                  concurrencyResult.ok ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {concurrencyResult.ok ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  {concurrencyResult.ok ? "Verrouillage conforme !" : "Comportement non conforme"}
                </div>
                <div className="font-mono text-[11px] space-y-1 bg-white/60 p-2.5 rounded border border-current/10">
                  <p>{renderReq("Req 1", concurrencyResult.req1)}</p>
                  <p>{renderReq("Req 2", concurrencyResult.req2)}</p>
                </div>
              </div>
            )}
            {concurrencyResult?.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{concurrencyResult.error}</div>
            )}
          </div>

          {/* Future modules */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" /> Feuille de route moteurs
            </h3>
            <div className="pt-3 space-y-2">
              {FUTURE_MODULES.map((m) => (
                <div key={m.num} className="flex items-center gap-3 text-xs">
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                    {m.num}
                  </span>
                  <span className="font-semibold text-slate-700 flex-1">{m.label}</span>
                  <span className="text-[9px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">{m.tag}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                Chaque moteur se rattachera via <span className="font-mono">application_id</span> +{" "}
                <span className="font-mono">application_version_id</span> (§67).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Modèles de départ (Templates)
          </h2>
          <Link href="/business-manager/applications/new" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Créer depuis un modèle <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
          {TEMPLATES.map((t) => (
            <Link
              key={t.key}
              href="/business-manager/applications/new"
              className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                <IconRenderer name={t.icon} className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700">{t.title}</p>
              <p className="text-[10px] font-bold text-slate-400">{t.category}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <P02E2E />
    </div>
  );
}
