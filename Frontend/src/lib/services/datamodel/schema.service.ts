import { db } from "@/db";
import {
  dataEntities,
  dataFields,
  dataRelations,
  dataConstraints,
  dataIndexes,
  dataValidations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { loadVersion, immutabilityGuard, dmAudit } from "./common";
import { getType, isNumericType, isTypeValid, SCOPES, CLASSIFICATIONS, RELATION_TYPES, DELETE_BEHAVIORS } from "./registry";
import { checkFormula, detectCycles } from "./formula";

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export class SchemaService {
  static async buildSchema(appId: string, versionId: string) {
    const entities = await db.select().from(dataEntities).where(eq(dataEntities.applicationVersionId, versionId));
    const entityIds = entities.map((e) => e.id);
    const allFields = entityIds.length
      ? await Promise.all(entityIds.map((id) => db.select().from(dataFields).where(eq(dataFields.entityId, id))))
      : [];
    const flatFields = allFields.flat();
    const relations = await db.select().from(dataRelations).where(eq(dataRelations.applicationVersionId, versionId));
    const constraints = entityIds.length
      ? (await Promise.all(entityIds.map((id) => db.select().from(dataConstraints).where(eq(dataConstraints.entityId, id))))).flat()
      : [];
    const indexes = entityIds.length
      ? (await Promise.all(entityIds.map((id) => db.select().from(dataIndexes).where(eq(dataIndexes.entityId, id))))).flat()
      : [];
    const validations = flatFields.length
      ? (await Promise.all(flatFields.map((f) => db.select().from(dataValidations).where(eq(dataValidations.fieldId, f.id))))).flat()
      : [];

    return {
      applicationId: appId,
      applicationVersionId: versionId,
      entities,
      fields: flatFields,
      relations,
      constraints,
      indexes,
      validations,
    };
  }

  static fingerprint(schema: any): string {
    const norm = {
      entities: [...schema.entities]
        .map((e: any) => ({ l: e.lineageId, c: e.code, n: e.name, s: e.scope, cl: e.classification, st: e.status }))
        .sort((a: any, b: any) => a.l.localeCompare(b.l)),
      fields: [...schema.fields]
        .map((f: any) => ({ l: f.lineageId, e: f.entityId, c: f.code, t: f.dataType, r: !!f.required, u: !!f.uniqueFlag, fx: f.formulaExpression }))
        .sort((a: any, b: any) => a.l.localeCompare(b.l)),
      relations: [...schema.relations]
        .map((r: any) => ({ l: r.lineageId, s: r.sourceEntityId, t: r.targetEntityId, ty: r.relationType, db: r.deleteBehavior }))
        .sort((a: any, b: any) => a.l.localeCompare(b.l)),
      constraints: [...schema.constraints].map((c: any) => ({ e: c.entityId, t: c.type, f: c.fieldIds })).sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      indexes: [...schema.indexes].map((i: any) => ({ e: i.entityId, t: i.type, f: i.fieldIds })).sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      validations: [...schema.validations].map((v: any) => ({ f: v.fieldId, t: v.type, c: v.configuration })).sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    };
    return djb2(JSON.stringify(norm));
  }

  // ---------------- VALIDATION ----------------
  static async validate(appId: string, versionId: string, actorId?: string, traceId?: string) {
    const schema = await this.buildSchema(appId, versionId);
    const errors: any[] = [];
    const warnings: any[] = [];
    const infos: any[] = [];
    const push = (arr: any[], code: string, severity: string, object_type: string, object_id: string, message: string, path?: string) =>
      arr.push({ code, severity, object_type, object_id, path, message });

    // Entity checks
    const eCodes = new Map<string, number>();
    for (const e of schema.entities) {
      eCodes.set(e.code, (eCodes.get(e.code) || 0) + 1);
      if (!/^[a-z][a-z0-9_]*$/.test(e.code))
        push(errors, "ENTITY_CODE_INVALID", "ERROR", "ENTITY", e.id, `Code d'entité invalide: "${e.code}".`, `entities.${e.code}`);
      if (!SCOPES.includes(e.scope)) push(errors, "SCHEMA_INVALID", "ERROR", "ENTITY", e.id, `Scope invalide sur ${e.code}: ${e.scope}.`);
      if (!CLASSIFICATIONS.includes(e.classification))
        push(errors, "SCHEMA_INVALID", "ERROR", "ENTITY", e.id, `Classification invalide sur ${e.code}.`);
      if (e.status === "ARCHIVED") push(infos, "ENTITY_ARCHIVED", "INFO", "ENTITY", e.id, `L'entité ${e.code} est archivée.`);
    }
    for (const [code, n] of eCodes) if (n > 1) push(errors, "ENTITY_CODE_ALREADY_EXISTS", "ERROR", "ENTITY", code, `Code d'entité dupliqué: ${code}.`);

    // Field checks + formula analysis
    const fieldById = new Map(schema.fields.map((f: any) => [f.id, f]));
    const formulaDeps: Record<string, string[]> = {};
    const formulaLabels: Record<string, string> = {};

    for (const e of schema.entities) {
      const eFields = schema.fields.filter((f: any) => f.entityId === e.id);
      const fCodes = new Map<string, number>();
      for (const f of eFields) fCodes.set(f.code, (fCodes.get(f.code) || 0) + 1);
      for (const [code, n] of fCodes)
        if (n > 1) push(errors, "FIELD_CODE_ALREADY_EXISTS", "ERROR", "FIELD", code, `Champ dupliqué "${code}" dans ${e.code}.`);

      const typeMap: Record<string, string> = {};
      for (const f of eFields) typeMap[f.code] = f.dataType === "FORMULA" ? f.formulaResultType || "DECIMAL" : f.dataType;

      for (const f of eFields) {
        if (!/^[a-z][a-z0-9_]*$/.test(f.code))
          push(errors, "FIELD_CODE_REQUIRED", "ERROR", "FIELD", f.id, `Code de champ invalide "${f.code}" dans ${e.code}.`);
        if (!isTypeValid(f.dataType))
          push(errors, "FIELD_TYPE_INVALID", "ERROR", "FIELD", f.id, `Type invalide ${f.dataType} sur ${e.code}.${f.code}.`);
        const def = getType(f.dataType);
        if (f.uniqueFlag && def && !def.supportsUnique)
          push(errors, "FIELD_TYPE_INVALID", "ERROR", "FIELD", f.id, `${f.dataType} ne supporte pas UNIQUE (${e.code}.${f.code}).`);

        if (f.dataType === "FORMULA") {
          const res = checkFormula(f.formulaExpression || "", typeMap);
          if (!res.valid) {
            for (const msg of res.errors)
              push(errors, msg.startsWith("FORMULA_REFERENCE_NOT_FOUND") ? "FORMULA_REFERENCE_NOT_FOUND" : "FORMULA_INVALID", "ERROR", "FIELD", f.id, `${e.code}.${f.code}: ${msg}`);
          } else {
            formulaDeps[f.code] = res.deps.filter((d) => {
              const dep = eFields.find((x: any) => x.code === d);
              return dep && dep.dataType === "FORMULA";
            });
            formulaLabels[f.code] = `${e.code}.${f.code}`;
            if (res.resultType && f.formulaResultType && res.resultType !== f.formulaResultType)
              push(warnings, "FORMULA_TYPE_MISMATCH", "WARNING", "FIELD", f.id, `Le type résultant de la formule (${res.resultType}) diffère du type enregistré (${f.formulaResultType}).`);
          }
        }
      }
    }

    // Circular dependencies
    const cyc = detectCycles(formulaDeps, formulaLabels);
    if (cyc.hasCycle) {
      for (const c of cyc.cycles)
        push(errors, "FORMULA_CIRCULAR_DEPENDENCY", "ERROR", "FORMULA", c.join("->"), `Dépendance circulaire détectée: ${c.map((x) => formulaLabels[x] || x).join(" → ")}.`);
    }

    // Relation checks
    const entityById = new Map(schema.entities.map((e: any) => [e.id, e]));
    for (const r of schema.relations) {
      const s = entityById.get(r.sourceEntityId);
      const t = entityById.get(r.targetEntityId);
      if (!s || !t) push(errors, "RELATION_TARGET_NOT_FOUND", "ERROR", "RELATION", r.id, "Relation pointant vers une entité inexistante.");
      if (!RELATION_TYPES.includes(r.relationType)) push(errors, "RELATION_INVALID", "ERROR", "RELATION", r.id, `Type de relation invalide: ${r.relationType}.`);
      if (!DELETE_BEHAVIORS.includes(r.deleteBehavior))
        push(errors, "RELATION_DELETE_BEHAVIOR_INVALID", "ERROR", "RELATION", r.id, `Delete behavior invalide: ${r.deleteBehavior}.`);
      if (r.deleteBehavior === "CASCADE")
        push(warnings, "RELATION_CASCADE_RISK", "WARNING", "RELATION", r.id, `CASCADE sur ${s?.code} → ${t?.code}: suppression en chaîne potentiellement dangereuse.`);
      if (r.required && r.deleteBehavior === "SET_NULL")
        push(errors, "RELATION_INVALID", "ERROR", "RELATION", r.id, "SET_NULL incompatible avec required.");
    }

    // Constraints & indexes field existence
    for (const c of schema.constraints) {
      const fids = (c.fieldIds as string[]) || [];
      for (const fid of fids)
        if (!fieldById.get(fid) || fieldById.get(fid)!.entityId !== c.entityId)
          push(errors, "CONSTRAINT_INVALID", "ERROR", "CONSTRAINT", c.id, `La contrainte ${c.name} référence un champ inexistant ou étranger à l'entité.`);
      if (c.type === "COMPOSITE_UNIQUE" && fids.length < 2)
        push(errors, "CONSTRAINT_INVALID", "ERROR", "CONSTRAINT", c.id, `COMPOSITE_UNIQUE ${c.name} exige ≥ 2 champs.`);
    }
    for (const ix of schema.indexes) {
      const fids = (ix.fieldIds as string[]) || [];
      for (const fid of fids)
        if (!fieldById.get(fid) || fieldById.get(fid)!.entityId !== ix.entityId)
          push(errors, "INDEX_INVALID", "ERROR", "INDEX", ix.id, `L'index ${ix.name} référence un champ inexistant ou étranger à l'entité.`);
    }

    // Validations compatibility
    for (const v of schema.validations) {
      const f = fieldById.get(v.fieldId);
      if (!f) push(errors, "VALIDATION_INVALID", "ERROR", "VALIDATION", v.id, "Validation attachée à un champ inexistant.");
      else {
        const def = getType(f.dataType);
        if (def && !def.supportedValidations.includes(v.type) && v.type !== "REQUIRED")
          push(errors, "VALIDATION_INVALID", "ERROR", "VALIDATION", v.id, `${v.type} incompatible avec ${f.dataType} (${f.code}).`);
      }
    }

    if (schema.entities.filter((e: any) => e.status === "ACTIVE").length === 0)
      push(warnings, "SCHEMA_EMPTY", "WARNING", "SCHEMA", versionId, "Le modèle ne contient aucune entité active.");

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
      infos,
      schemaHash: this.fingerprint(schema),
      validatedAt: new Date().toISOString(),
      counts: {
        entities: schema.entities.length,
        fields: schema.fields.length,
        relations: schema.relations.length,
      },
    };

    if (actorId) {
      await dmAudit({
        applicationId: appId,
        applicationVersionId: versionId,
        actorId,
        eventType: result.valid ? "data.schema.validated" : "data.schema.invalid",
        action: "SCHEMA_VALIDATE",
        targetType: "SCHEMA",
        targetId: versionId,
        result: result.valid ? "SUCCESS" : "FAILED",
        metadata: { errors: errors.length, warnings: warnings.length, hash: result.schemaHash },
        traceId,
      });
    }

    return result;
  }

  // ---------------- DEPENDENCIES ----------------
  static async dependencies(versionId: string) {
    const schema = await this.buildSchema("", versionId);
    const nodes: any[] = [];
    const edges: any[] = [];
    const fieldById = new Map(schema.fields.map((f: any) => [f.id, f]));
    const entityById = new Map(schema.entities.map((e: any) => [e.id, e]));

    for (const e of schema.entities) nodes.push({ type: "ENTITY", id: e.id, label: e.code });
    for (const f of schema.fields)
      nodes.push({ type: "FIELD", id: f.id, label: `${entityById.get(f.entityId)?.code}.${f.code}`, dataType: f.dataType });

    for (const f of schema.fields) {
      if (f.dataType === "FORMULA" && f.formulaExpression) {
        const res = checkFormula(f.formulaExpression, Object.fromEntries(schema.fields.filter((x: any) => x.entityId === f.entityId).map((x: any) => [x.code, x.dataType === "FORMULA" ? x.formulaResultType || "DECIMAL" : x.dataType])));
        for (const depCode of res.deps) {
          const dep = schema.fields.find((x: any) => x.entityId === f.entityId && x.code === depCode);
          if (dep) edges.push({ source: { type: "FIELD", id: f.id }, target: { type: "FIELD", id: dep.id }, dependencyType: "CALCULATES_FROM" });
        }
      }
    }
    for (const v of schema.validations) {
      const f = fieldById.get(v.fieldId);
      if (f) edges.push({ source: { type: "VALIDATION", id: v.id, label: v.type }, target: { type: "FIELD", id: f.id }, dependencyType: "VALIDATES" });
    }
    for (const c of schema.constraints)
      for (const fid of (c.fieldIds as string[]) || [])
        edges.push({ source: { type: "CONSTRAINT", id: c.id, label: c.type }, target: { type: "FIELD", id: fid }, dependencyType: "VALIDATES" });
    for (const ix of schema.indexes)
      for (const fid of (ix.fieldIds as string[]) || [])
        edges.push({ source: { type: "INDEX", id: ix.id, label: ix.name }, target: { type: "FIELD", id: fid }, dependencyType: "INDEXES" });
    for (const r of schema.relations) {
      edges.push({ source: { type: "RELATION", id: r.id }, target: { type: "ENTITY", id: r.sourceEntityId }, dependencyType: "RELATES_TO" });
      edges.push({ source: { type: "RELATION", id: r.id }, target: { type: "ENTITY", id: r.targetEntityId }, dependencyType: "RELATES_TO" });
    }

    return { nodes, edges };
  }

  static async dependenciesOf(versionId: string, objectType: string, objectId: string) {
    const { nodes, edges } = await this.dependencies(versionId);
    const incoming = edges.filter((e) => e.target.type === objectType && e.target.id === objectId);
    const outgoing = edges.filter((e) => e.source.type === objectType && e.source.id === objectId);
    const labelOf = (ref: any) => nodes.find((n) => n.type === ref.type && n.id === ref.id)?.label || ref.id;
    return {
      incoming: incoming.map((e) => ({ ...e.source, label: labelOf(e.source), dependencyType: e.dependencyType })),
      outgoing: outgoing.map((e) => ({ ...e.target, label: labelOf(e.target), dependencyType: e.dependencyType })),
    };
  }

  // ---------------- IMPACT ANALYSIS ----------------
  static async impactAnalysis(versionId: string, change: any) {
    const schema = await this.buildSchema("", versionId);
    const kind = change.kind;
    const direct: any[] = [];
    const indirect: any[] = [];
    const warnings: string[] = [];
    const requiredActions: string[] = [];
    let risk: "SAFE" | "WARNING" | "BREAKING" | "DATA_LOSS_RISK" = "SAFE";
    const bump = (r: typeof risk) => {
      const order = ["SAFE", "WARNING", "BREAKING", "DATA_LOSS_RISK"];
      if (order.indexOf(r) > order.indexOf(risk)) risk = r;
    };

    const fieldById = new Map(schema.fields.map((f: any) => [f.id, f]));
    const entityById = new Map(schema.entities.map((e: any) => [e.id, e]));

    if (kind === "FIELD_ADD") {
      risk = "SAFE";
    } else if (kind === "FIELD_RENAME") {
      bump("WARNING");
      requiredActions.push("Mettre à jour les références (formules, requêtes, formulaires) via un mapping RENAME.");
    } else if (kind === "FIELD_TYPE_CHANGE") {
      const field = fieldById.get(change.fieldId);
      const from = field?.dataType;
      const to = change.proposedType;
      const sameNumeric = isNumericType(from || "") && isNumericType(to || "");
      bump(sameNumeric ? "WARNING" : "BREAKING");
      // dependents: formulas using this field
      for (const f of schema.fields) {
        if (f.dataType === "FORMULA" && f.formulaExpression && new RegExp(`\\b${field?.code}\\b`).test(f.formulaExpression)) {
          direct.push({ type: "FIELD", id: f.id, label: `${entityById.get(f.entityId)?.code}.${f.code}`, dependencyType: "CALCULATES_FROM" });
          if (!isNumericType(to || "")) bump("BREAKING");
        }
      }
      for (const v of schema.validations) if (v.fieldId === change.fieldId) direct.push({ type: "VALIDATION", id: v.id, label: v.type, dependencyType: "VALIDATES" });
      for (const ix of schema.indexes) if (((ix.fieldIds as string[]) || []).includes(change.fieldId)) direct.push({ type: "INDEX", id: ix.id, label: ix.name, dependencyType: "INDEXES" });
      for (const c of schema.constraints) if (((c.fieldIds as string[]) || []).includes(change.fieldId)) direct.push({ type: "CONSTRAINT", id: c.id, label: c.type, dependencyType: "VALIDATES" });
      requiredActions.push("Prévoir un mapping CAST dans le plan de migration.");
    } else if (kind === "FIELD_REMOVE") {
      const field = fieldById.get(change.fieldId);
      let hasDep = false;
      for (const f of schema.fields) {
        if (f.dataType === "FORMULA" && f.formulaExpression && new RegExp(`\\b${field?.code}\\b`).test(f.formulaExpression)) {
          direct.push({ type: "FIELD", id: f.id, label: `${entityById.get(f.entityId)?.code}.${f.code}`, dependencyType: "CALCULATES_FROM" });
          hasDep = true;
        }
      }
      for (const v of schema.validations) if (v.fieldId === change.fieldId) { direct.push({ type: "VALIDATION", id: v.id, label: v.type }); hasDep = true; }
      for (const ix of schema.indexes) if (((ix.fieldIds as string[]) || []).includes(change.fieldId)) { direct.push({ type: "INDEX", id: ix.id, label: ix.name }); hasDep = true; }
      for (const c of schema.constraints) if (((c.fieldIds as string[]) || []).includes(change.fieldId)) { direct.push({ type: "CONSTRAINT", id: c.id, label: c.type }); hasDep = true; }
      if (hasDep || field?.required) {
        bump("DATA_LOSS_RISK");
        warnings.push("Le champ est référencé ou obligatoire : suppression destructrice.");
        requiredActions.push("Confirmation explicite + plan de migration obligatoire.");
      } else {
        bump("BREAKING");
      }
    } else if (kind === "ENTITY_REMOVE" || kind === "ENTITY_ARCHIVE") {
      const eid = change.entityId;
      for (const r of schema.relations)
        if (r.sourceEntityId === eid || r.targetEntityId === eid)
          direct.push({ type: "RELATION", id: r.id, label: `${entityById.get(r.sourceEntityId)?.code} → ${entityById.get(r.targetEntityId)?.code}`, dependencyType: "RELATES_TO" });
      const eFields = schema.fields.filter((f: any) => f.entityId === eid);
      for (const f of eFields)
        for (const other of schema.fields)
          if (other.dataType === "FORMULA" && other.entityId !== eid && other.formulaExpression && new RegExp(`\\b${f.code}\\b`).test(other.formulaExpression))
            indirect.push({ type: "FIELD", id: other.id, label: other.code });
      bump("DATA_LOSS_RISK");
      requiredActions.push("Archiver de préférence ; confirmation explicite requise.");
    } else if (kind === "RELATION_REMOVE") {
      bump("WARNING");
      requiredActions.push("Vérifier les dépendances Query / Form référençant cette relation.");
    } else {
      bump("WARNING");
    }

    return {
      change,
      riskLevel: risk,
      directDependencies: direct,
      indirectDependencies: indirect,
      affectedComponents: [...direct, ...indirect],
      warnings,
      requiredActions,
    };
  }

  // ---------------- DIFF ----------------
  static async diff(versionAId: string, versionBId: string) {
    const a = await this.buildSchema("", versionAId);
    const b = await this.buildSchema("", versionBId);
    const changes: any[] = [];
    let seq = 0;
    const add = (type: string, object_type: string, object_id: string, before: any, after: any, risk: string) =>
      changes.push({ id: `chg_${++seq}`, type, objectType: object_type, objectId: object_id, before, after, riskLevel: risk, dependencies: [] });

    const eByLineageA = new Map(a.entities.map((e: any) => [e.lineageId, e]));
    const eByLineageB = new Map(b.entities.map((e: any) => [e.lineageId, e]));

    for (const [lin, eb] of eByLineageB) {
      const ea = eByLineageA.get(lin);
      if (!ea) {
        add("ENTITY_ADDED", "ENTITY", eb.id, null, { code: eb.code, name: eb.name }, "SAFE");
      } else {
        if (ea.status !== "ARCHIVED" && eb.status === "ARCHIVED") add("ENTITY_ARCHIVED", "ENTITY", eb.id, { status: ea.status }, { status: "ARCHIVED" }, "WARNING");
        if (ea.code !== eb.code) add("ENTITY_RENAMED", "ENTITY", eb.id, { code: ea.code }, { code: eb.code }, "WARNING");
        else if (ea.name !== eb.name || ea.scope !== eb.scope || ea.classification !== eb.classification)
          add("ENTITY_UPDATED", "ENTITY", eb.id, { name: ea.name, scope: ea.scope }, { name: eb.name, scope: eb.scope }, "SAFE");
      }
    }
    for (const [lin, ea] of eByLineageA) if (!eByLineageB.has(lin)) add("ENTITY_ARCHIVED", "ENTITY", ea.id, { code: ea.code }, null, "WARNING");

    const fByLineageA = new Map(a.fields.map((f: any) => [f.lineageId, f]));
    const fByLineageB = new Map(b.fields.map((f: any) => [f.lineageId, f]));
    for (const [lin, fb] of fByLineageB) {
      const fa = fByLineageA.get(lin);
      if (!fa) {
        add("FIELD_ADDED", "FIELD", fb.id, null, { code: fb.code, dataType: fb.dataType }, "SAFE");
      } else {
        if (fa.code !== fb.code) add("FIELD_RENAMED", "FIELD", fb.id, { code: fa.code }, { code: fb.code }, "WARNING");
        if (fa.dataType !== fb.dataType)
          add("FIELD_TYPE_CHANGED", "FIELD", fb.id, { dataType: fa.dataType }, { dataType: fb.dataType }, isNumericType(fa.dataType) && isNumericType(fb.dataType) ? "WARNING" : "BREAKING");
        else if (
          fa.required !== fb.required || fa.uniqueFlag !== fb.uniqueFlag || fa.indexed !== fb.indexed ||
          JSON.stringify(fa.defaultValue) !== JSON.stringify(fb.defaultValue) || fa.formulaExpression !== fb.formulaExpression
        )
          add(fa.formulaExpression !== fb.formulaExpression ? "FORMULA_CHANGED" : "FIELD_UPDATED", "FIELD", fb.id,
            { required: fa.required, formula: fa.formulaExpression },
            { required: fb.required, formula: fb.formulaExpression }, "WARNING");
      }
    }
    for (const [lin, fa] of fByLineageA)
      if (!fByLineageB.has(lin)) add("FIELD_REMOVED", "FIELD", fa.id, { code: fa.code, dataType: fa.dataType }, null, fa.required ? "DATA_LOSS_RISK" : "BREAKING");

    const rByLineageA = new Map(a.relations.map((r: any) => [r.lineageId, r]));
    const rByLineageB = new Map(b.relations.map((r: any) => [r.lineageId, r]));
    for (const [lin, rb] of rByLineageB) {
      const ra = rByLineageA.get(lin);
      if (!ra) add("RELATION_ADDED", "RELATION", rb.id, null, { type: rb.relationType }, "SAFE");
      else if (ra.relationType !== rb.relationType || ra.deleteBehavior !== rb.deleteBehavior || ra.required !== rb.required)
        add("RELATION_UPDATED", "RELATION", rb.id, { type: ra.relationType, db: ra.deleteBehavior }, { type: rb.relationType, db: rb.deleteBehavior }, "WARNING");
    }
    for (const [lin, ra] of rByLineageA) if (!rByLineageB.has(lin)) add("RELATION_REMOVED", "RELATION", ra.id, { type: ra.relationType }, null, "WARNING");

    return {
      sourceVersionId: versionAId,
      targetVersionId: versionBId,
      changes,
      summary: {
        added: changes.filter((c) => c.type.endsWith("_ADDED")).length,
        updated: changes.filter((c) => c.type.endsWith("_UPDATED") || c.type.endsWith("_RENAMED") || c.type.endsWith("_CHANGED")).length,
        removed: changes.filter((c) => c.type.endsWith("_REMOVED") || c.type.endsWith("_ARCHIVED")).length,
        breaking: changes.filter((c) => c.riskLevel === "BREAKING").length,
        dataLoss: changes.filter((c) => c.riskLevel === "DATA_LOSS_RISK").length,
      },
    };
  }

  // ---------------- MIGRATION PLAN ----------------
  static async createMigrationPlan(appId: string, sourceVersionId: string, targetVersionId: string, actor: any, traceId?: string) {
    const diffRes = await this.diff(sourceVersionId, targetVersionId);
    const validation = await this.validate(appId, targetVersionId);

    const steps: any[] = [];
    let order = 0;
    for (const c of diffRes.changes) {
      const automatic = c.riskLevel === "SAFE";
      const requiresConfirmation = c.riskLevel === "BREAKING" || c.riskLevel === "DATA_LOSS_RISK";
      let operation = c.type;
      let transformation = null;
      if (c.type === "FIELD_RENAMED" || c.type === "ENTITY_RENAMED") transformation = "RENAME";
      if (c.type === "FIELD_TYPE_CHANGED") transformation = "CAST";
      steps.push({
        id: `step_${++order}`,
        order,
        operation,
        targetType: c.objectType,
        targetId: c.objectId,
        riskLevel: c.riskLevel,
        automatic,
        requiresConfirmation,
        configuration: { before: c.before, after: c.after, transformation },
      });
    }

    const riskSummary = {
      safe: diffRes.changes.filter((c) => c.riskLevel === "SAFE").length,
      warnings: diffRes.changes.filter((c) => c.riskLevel === "WARNING").length,
      breaking: diffRes.changes.filter((c) => c.riskLevel === "BREAKING").length,
      dataLoss: diffRes.changes.filter((c) => c.riskLevel === "DATA_LOSS_RISK").length,
    };

    const status = !validation.valid ? "BLOCKED" : riskSummary.dataLoss > 0 ? "DRAFT" : "READY";

    await dmAudit({
      applicationId: appId,
      applicationVersionId: targetVersionId,
      actorId: actor?.id || "system",
      eventType: "data.migration.plan.created",
      action: "MIGRATION_PLAN_CREATE",
      targetType: "MIGRATION_PLAN",
      targetId: targetVersionId,
      metadata: { sourceVersionId, status, riskSummary },
      traceId,
    });

    return {
      id: randomUUID(),
      applicationId: appId,
      sourceVersionId,
      targetVersionId,
      status,
      riskSummary,
      steps,
      mappings: steps
        .filter((s) => s.configuration.transformation)
        .map((s) => ({
          sourceFields: [s.configuration.before?.code || s.configuration.before?.dataType],
          targetFields: [s.configuration.after?.code || s.configuration.after?.dataType],
          transformationType: s.configuration.transformation,
          fallback: null,
          validation: s.riskLevel === "SAFE" ? "AUTO" : "MANUAL_CONFIRM",
        })),
      schemaValid: validation.valid,
      createdAt: new Date().toISOString(),
    };
  }

  // ---------------- CLONE (new application version) ----------------
  static async cloneVersionData(srcVersionId: string, dstVersionId: string, appId: string) {
    const entities = await db.select().from(dataEntities).where(eq(dataEntities.applicationVersionId, srcVersionId));
    const entityIdMap = new Map<string, string>();
    for (const e of entities) {
      const newId = randomUUID();
      entityIdMap.set(e.id, newId);
      await db.insert(dataEntities).values({ ...e, id: newId, applicationVersionId: dstVersionId, applicationId: appId, version: 1, createdAt: new Date(), updatedAt: new Date() });
    }
    const fieldIdMap = new Map<string, string>();
    for (const eid of entities.map((e) => e.id)) {
      const fields = await db.select().from(dataFields).where(eq(dataFields.entityId, eid));
      for (const f of fields) {
        const newId = randomUUID();
        fieldIdMap.set(f.id, newId);
        await db.insert(dataFields).values({ ...f, id: newId, entityId: entityIdMap.get(eid)!, version: 1, createdAt: new Date(), updatedAt: new Date() });
      }
    }
    for (const eid of entities.map((e) => e.id)) {
      const cons = await db.select().from(dataConstraints).where(eq(dataConstraints.entityId, eid));
      for (const c of cons)
        await db.insert(dataConstraints).values({ ...c, id: randomUUID(), entityId: entityIdMap.get(eid)!, fieldIds: ((c.fieldIds as string[]) || []).map((x) => fieldIdMap.get(x) || x), createdAt: new Date() });
      const ixs = await db.select().from(dataIndexes).where(eq(dataConstraints.entityId, eid));
      for (const ix of ixs)
        await db.insert(dataIndexes).values({ ...ix, id: randomUUID(), entityId: entityIdMap.get(eid)!, fieldIds: ((ix.fieldIds as string[]) || []).map((x) => fieldIdMap.get(x) || x), createdAt: new Date() });
    }
    for (const fid of fieldIdMap.keys()) {
      const vals = await db.select().from(dataValidations).where(eq(dataValidations.fieldId, fid));
      for (const v of vals)
        await db.insert(dataValidations).values({ ...v, id: randomUUID(), fieldId: fieldIdMap.get(fid)!, createdAt: new Date() });
    }
    const relations = await db.select().from(dataRelations).where(eq(dataRelations.applicationVersionId, srcVersionId));
    for (const r of relations) {
      const src = entityIdMap.get(r.sourceEntityId);
      const tgt = entityIdMap.get(r.targetEntityId);
      if (src && tgt)
        await db.insert(dataRelations).values({ ...r, id: randomUUID(), applicationVersionId: dstVersionId, sourceEntityId: src, targetEntityId: tgt, version: 1, createdAt: new Date() });
    }
    return { entities: entities.length, fields: fieldIdMap.size, relations: relations.length };
  }

  // ---------------- TEMPLATES ----------------
  static TEMPLATES = [
    {
      id: "tpl_customer", code: "customer", name: "Customer", description: "Entité client standard avec contact & adresse.",
      definition: [
        { code: "customer", name: "Client", pluralName: "Clients", icon: "Users", fields: [
          { code: "first_name", label: "Prénom", dataType: "TEXT", required: true },
          { code: "last_name", label: "Nom", dataType: "TEXT", required: true },
          { code: "full_name", label: "Nom complet", dataType: "FORMULA", formula: 'concat(first_name, " ", last_name)' },
          { code: "email", label: "Email", dataType: "EMAIL", unique: true },
          { code: "phone", label: "Téléphone", dataType: "PHONE" },
        ]},
      ],
    },
    {
      id: "tpl_product", code: "product", name: "Product", description: "Entité produit avec prix & stock.",
      definition: [
        { code: "product", name: "Produit", pluralName: "Produits", icon: "Package", fields: [
          { code: "name", label: "Nom", dataType: "TEXT", required: true },
          { code: "reference", label: "Référence", dataType: "TEXT", unique: true },
          { code: "price", label: "Prix de vente", dataType: "CURRENCY", required: true },
          { code: "quantity", label: "Stock", dataType: "INTEGER" },
          { code: "active", label: "Actif", dataType: "BOOLEAN" },
        ]},
      ],
    },
    {
      id: "tpl_address", code: "address", name: "Address", description: "Groupe de champs adresse réutilisable.",
      definition: [
        { code: "address", name: "Adresse", pluralName: "Adresses", icon: "MapPin", fields: [
          { code: "address_line", label: "Adresse", dataType: "TEXT", required: true },
          { code: "city", label: "Ville", dataType: "TEXT", required: true },
          { code: "postal_code", label: "Code postal", dataType: "TEXT" },
          { code: "country", label: "Pays", dataType: "TEXT" },
        ]},
      ],
    },
    {
      id: "tpl_audit", code: "audit_fields", name: "Audit Fields", description: "Champs d'audit standard (création / modification).",
      definition: [
        { code: "audit_trace", name: "Trace d'audit", pluralName: "Traces", icon: "History", fields: [
          { code: "created_by", label: "Créé par", dataType: "TEXT" },
          { code: "created_at", label: "Créé le", dataType: "DATETIME" },
          { code: "updated_at", label: "Modifié le", dataType: "DATETIME" },
        ]},
      ],
    },
  ];

  static async applyTemplate(appId: string, versionId: string, templateId: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const tpl = this.TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return { success: false, error: { code: "DATA_MODEL_NOT_FOUND", message: "Template introuvable." } };

    const created: string[] = [];
    for (const entDef of tpl.definition) {
      let code = entDef.code;
      const [exists] = await db.select({ id: dataEntities.id }).from(dataEntities).where(and(eq(dataEntities.applicationVersionId, versionId), eq(dataEntities.code, code)));
      if (exists) code = `${entDef.code}_${Date.now().toString().slice(-4)}`;
      const eid = randomUUID();
      await db.insert(dataEntities).values({
        id: eid, applicationId: appId, applicationVersionId: versionId, lineageId: eid,
        code, name: entDef.name, pluralName: entDef.pluralName, icon: entDef.icon || "Database",
        createdBy: actor.id,
      });
      let pos = 0;
      for (const fDef of entDef.fields) {
        const fid = randomUUID();
        const isFormula = fDef.dataType === "FORMULA";
        let resultType = null;
        if (isFormula) {
          const types: Record<string, string> = {};
          const siblings = await db.select().from(dataFields).where(eq(dataFields.entityId, eid));
          for (const s of siblings) types[s.code] = s.dataType === "FORMULA" ? s.formulaResultType || "DECIMAL" : s.dataType;
          const chk = checkFormula(fDef.formula || "", types);
          resultType = chk.resultType;
        }
        await db.insert(dataFields).values({
          id: fid, entityId: eid, lineageId: fid, code: fDef.code, label: fDef.label,
          dataType: fDef.dataType, required: !!fDef.required, uniqueFlag: !!fDef.unique,
          position: pos++, formulaExpression: isFormula ? fDef.formula : null, formulaResultType: resultType,
        });
      }
      created.push(code);
    }

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.schema.changed", action: "TEMPLATE_APPLY", targetType: "TEMPLATE", targetId: templateId,
      metadata: { entities: created }, traceId,
    });

    return { success: true, data: { applied: created } };
  }

  static async exportSchema(appId: string, versionId: string) {
    const schema = await this.buildSchema(appId, versionId);
    return {
      formatVersion: "1.0",
      exportedAt: new Date().toISOString(),
      schemaHash: this.fingerprint(schema),
      ...schema,
    };
  }
}

export { SchemaService as FormulaService };
