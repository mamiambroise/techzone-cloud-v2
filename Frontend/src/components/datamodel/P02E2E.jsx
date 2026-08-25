"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { api, dm } from "@/lib/api-client";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INITIAL = [
  { id: 1, label: "1. Créer Application 'Boutique P02' + version 1.0.0 DRAFT", status: "idle" },
  { id: 2, label: "2. Créer Entities Customer, Product, Order, OrderLine", status: "idle" },
  { id: 3, label: "3. Créer Fields Product + OrderLine.subtotal (FORMULA)", status: "idle" },
  { id: 4, label: "4. Créer Relations Customer→Order→OrderLine←Product", status: "idle" },
  { id: 5, label: "5. Schema Validator → VALID", status: "idle" },
  { id: 6, label: "6. Publier v1.0.0 (P0.1) → snapshot immuable", status: "idle" },
  { id: 7, label: "7. Créer v1.1.0 DRAFT (clone automatique du Data Model)", status: "idle" },
  { id: 8, label: "8. Ajouter Product.purchase_price & category → Diff = 2 FIELD_ADDED SAFE", status: "idle" },
  { id: 9, label: "9. Migration Plan → READY", status: "idle" },
  { id: 10, label: "10. Breaking: price CURRENCY→TEXT → Impact BREAKING", status: "idle" },
  { id: 11, label: "11. Formules circulaires A=B+1 / B=A+1 → REFUSED", status: "idle" },
  { id: 12, label: "12. Mutation sur v1.0.0 PUBLISHED → SCHEMA_IMMUTABLE", status: "idle" },
  { id: 13, label: "13. Update concurrent obsolète → 409 VERSION_CONFLICT", status: "idle" },
];

export function P02E2E() {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(INITIAL);
  const allPassed = steps.every((s) => s.status === "passed");

  const set = (id, status, log) => setSteps((p) => p.map((s) => (s.id === id ? { ...s, status, log } : s)));

  const run = async () => {
    setRunning(true);
    setSteps(INITIAL);
    const ts = Date.now().toString().slice(-4);
    let appId = "", v1 = "", v11 = "";
    let customer, product, order, orderLine;

    try {
      set(1, "running"); await sleep(250);
      const ca = await api.createApplication({ name: `Boutique P02 ${ts}`, code: `boutique-p02-${ts}`, category: "Commerce", icon: "ShoppingBag", environment: "PRODUCTION" });
      if (!ca.success) throw new Error(ca.error?.message);
      appId = ca.data.id;
      const lv = await api.listVersions(appId);
      v1 = lv.data[0].id;
      set(1, "passed", ca.data.code);

      set(2, "running"); await sleep(250);
      const mk = (code, name, plural) => dm.createEntity(appId, v1, { code, name, plural_name: plural });
      const [c, p, o, ol] = await Promise.all([mk("customer", "Client", "Clients"), mk("product", "Produit", "Produits"), mk("order", "Commande", "Commandes"), mk("order_line", "Ligne de commande", "Lignes")]);
      if ([c, p, o, ol].some((r) => !r.success)) throw new Error([c, p, o, ol].find((r) => !r.success)?.error?.message);
      customer = c.data; product = p.data; order = o.data; orderLine = ol.data;
      set(2, "passed", "4 entités");

      set(3, "running"); await sleep(250);
      const fp = (payload) => dm.createField(appId, v1, product.id, payload);
      const fo = (payload) => dm.createField(appId, v1, orderLine.id, payload);
      const r1 = await fp({ code: "name", label: "Nom", data_type: "TEXT", required: true });
      const r2 = await fp({ code: "reference", label: "Référence", data_type: "TEXT", unique: true });
      const r3 = await fp({ code: "price", label: "Prix", data_type: "CURRENCY", required: true });
      const r4 = await fp({ code: "quantity", label: "Stock", data_type: "INTEGER" });
      const r5 = await fo({ code: "quantity", label: "Quantité", data_type: "INTEGER", required: true });
      const r6 = await fo({ code: "unit_price", label: "Prix unitaire", data_type: "CURRENCY", required: true });
      const r7 = await fo({ code: "subtotal", label: "Sous-total", data_type: "FORMULA", formula_expression: "quantity * unit_price" });
      if ([r1, r2, r3, r4, r5, r6, r7].some((r) => !r.success)) throw new Error([r1, r2, r3, r4, r5, r6, r7].find((r) => !r.success)?.error?.message);
      set(3, "passed", "subtotal = quantity * unit_price");

      set(4, "running"); await sleep(250);
      const rel = (s, t, type) => dm.createRelation(appId, v1, { sourceEntityId: s, targetEntityId: t, relation_type: type, delete_behavior: "RESTRICT" });
      const [rel1, rel2, rel3] = await Promise.all([rel(customer.id, order.id, "ONE_TO_MANY"), rel(order.id, orderLine.id, "ONE_TO_MANY"), rel(product.id, orderLine.id, "ONE_TO_MANY")]);
      if ([rel1, rel2, rel3].some((r) => !r.success)) throw new Error("Relation invalide");
      set(4, "passed", "3 relations 1:N");

      set(5, "running"); await sleep(250);
      const val = await dm.validateSchema(appId, v1);
      if (!val.success || !val.data.valid) throw new Error(`Schema invalid: ${val.data?.errors?.[0]?.message || val.error?.message}`);
      set(5, "passed", `hash ${val.data.schemaHash}`);

      set(6, "running"); await sleep(250);
      const pub = await api.publishVersion(appId, v1, "PRODUCTION");
      if (!pub.success) throw new Error(pub.error?.message);
      set(6, "passed", "v1.0.0 ACTIVE");

      set(7, "running"); await sleep(250);
      const cv = await api.createVersion(appId, { versionNumber: "1.1.0", sourceVersionId: v1, comment: "Évolution Data Model" });
      if (!cv.success) throw new Error(cv.error?.message);
      v11 = cv.data.id;
      const ents11 = await dm.listEntities(appId, v11);
      if (!ents11.success || ents11.data.length !== 4) throw new Error("Clone du Data Model incomplet");
      set(7, "passed", "4 entités clonées");

      set(8, "running"); await sleep(250);
      const prod11 = ents11.data.find((e) => e.code === "product");
      const a1 = await dm.createField(appId, v11, prod11.id, { code: "purchase_price", label: "Prix d'achat", data_type: "CURRENCY" });
      const a2 = await dm.createField(appId, v11, prod11.id, { code: "category", label: "Catégorie", data_type: "TEXT" });
      if (!a1.success || !a2.success) throw new Error(a1.error?.message || a2.error?.message);
      const diff = await dm.getChanges(appId, v11, v1);
      const added = diff.data.changes.filter((c) => c.type === "FIELD_ADDED");
      const safe = added.every((c) => c.riskLevel === "SAFE");
      if (added.length !== 2 || !safe) throw new Error(`Diff inattendu: ${added.length} FIELD_ADDED`);
      set(8, "passed", "2 FIELD_ADDED • SAFE");

      set(9, "running"); await sleep(250);
      const mp = await dm.createMigrationPlan(appId, v11, v1);
      if (!mp.success || mp.data.status !== "READY") throw new Error(`Migration status: ${mp.data?.status}`);
      set(9, "passed", `${mp.data.steps.length} étapes`);

      set(10, "running"); await sleep(250);
      const priceField = (await dm.listFields(appId, v11, prod11.id)).data.find((f) => f.code === "price");
      const imp = await dm.impactAnalysis(appId, v11, { kind: "FIELD_TYPE_CHANGE", fieldId: priceField.id, proposedType: "TEXT" });
      if (imp.data.riskLevel !== "BREAKING") throw new Error(`Risque attendu BREAKING, obtenu ${imp.data.riskLevel}`);
      set(10, "passed", "BREAKING confirmé");

      set(11, "running"); await sleep(250);
      const ce = await dm.createEntity(appId, v11, { code: "cycle_test", name: "Cycle Test" });
      await dm.createField(appId, v11, ce.data.id, { code: "field_a", label: "A", data_type: "INTEGER" });
      await dm.createField(appId, v11, ce.data.id, { code: "field_b", label: "B", data_type: "INTEGER" });
      const fa = (await dm.listFields(appId, v11, ce.data.id)).data.find((f) => f.code === "field_a");
      const fb = (await dm.listFields(appId, v11, ce.data.id)).data.find((f) => f.code === "field_b");
      await dm.updateField(appId, v11, ce.data.id, fa.id, { data_type: "FORMULA", label: "A", formula_expression: "field_b + 1" });
      await dm.updateField(appId, v11, ce.data.id, fb.id, { data_type: "FORMULA", label: "B", formula_expression: "field_a + 1" });
      const valC = await dm.validateSchema(appId, v11);
      const hasCycle = valC.data.errors.some((e) => e.code === "FORMULA_CIRCULAR_DEPENDENCY");
      if (!hasCycle || valC.data.valid) throw new Error("Cycle non détecté");
      set(11, "passed", "FORMULA_CIRCULAR_DEPENDENCY");

      set(12, "running"); await sleep(250);
      const imm = await dm.createEntity(appId, v1, { code: "ghost", name: "Ghost" });
      if (imm.success || imm.error?.code !== "SCHEMA_IMMUTABLE") throw new Error(`Attendu SCHEMA_IMMUTABLE, obtenu ${imm.error?.code}`);
      set(12, "passed", "v1.0.0 intacte");

      set(13, "running"); await sleep(250);
      const conf = await dm.updateField(appId, v11, prod11.id, priceField.id, { label: "Prix VT", expectedVersion: priceField.version + 7 });
      if (conf.success || conf.error?.code !== "VERSION_CONFLICT") throw new Error(`Attendu VERSION_CONFLICT, obtenu ${conf.error?.code}`);
      set(13, "passed", "409 VERSION_CONFLICT");
    } catch (err) {
      console.error(err);
      setSteps((p) => p.map((s) => (s.status === "running" ? { ...s, status: "failed", log: err.message } : s)));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Acceptance Gate P0.2 — Scénario E2E automatisé
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Boutique : entities, fields, formula, relations, validation, publication, diff, migration + 3 preuves négatives (immutabilité, cycle, concurrence).
          </p>
        </div>
        <button onClick={run} disabled={running} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider self-start">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Lancer le Gate P0.2
        </button>
      </div>
      <div className="space-y-1.5">
        {steps.map((s) => (
          <div key={s.id} className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${s.status === "passed" ? "bg-green-50/60 border-green-200" : s.status === "running" ? "bg-blue-50 border-blue-300" : s.status === "failed" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200/60 text-slate-500"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {s.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : s.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" /> : s.status === "failed" ? <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" /> : <span className="w-4 h-4 rounded-full border border-slate-300 text-[9px] flex items-center justify-center flex-shrink-0">{s.id}</span>}
              <span className="font-bold truncate">{s.label}</span>
            </div>
            {s.log && <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60 whitespace-nowrap">{s.log}</span>}
          </div>
        ))}
      </div>
      {allPassed && (
        <p className="text-xs font-black text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          ✓ GATE P0.2 VALIDÉ — parcours complet DESIGN → VALIDATE → DEPENDENCIES → COMPARE → IMPACT → MIGRATION → PUBLISH + preuves négatives conformes.
        </p>
      )}
    </div>
  );
}
