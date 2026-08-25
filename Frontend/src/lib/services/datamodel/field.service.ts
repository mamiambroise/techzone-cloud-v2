import { db } from "@/db";
import { dataFields, dataEntities, dataValidations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ENTITY_CODE_REGEX, loadVersion, immutabilityGuard, versionConflict, dmAudit } from "./common";
import { getType, isTypeValid, checkDefaultValue, SCOPES, CLASSIFICATIONS } from "./registry";
import { checkFormula } from "./formula";

export class FieldService {
  static async list(entityId: string) {
    const rows = await db.select().from(dataFields).where(eq(dataFields.entityId, entityId)).orderBy(asc(dataFields.position));
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  static async fieldTypesMap(entityId: string): Promise<Record<string, string>> {
    const rows = await db.select().from(dataFields).where(eq(dataFields.entityId, entityId));
    const map: Record<string, string> = {};
    for (const f of rows) {
      map[f.code] = f.dataType === "FORMULA" ? f.formulaResultType || "DECIMAL" : f.dataType;
    }
    return map;
  }

  static validateInput(input: any, existingTypes: Record<string, string>, selfCode?: string) {
    const code = (input.code || "").trim();
    if (!code) return { code: "FIELD_CODE_REQUIRED", message: "Le code du champ est obligatoire." };
    if (!ENTITY_CODE_REGEX.test(code))
      return { code: "FIELD_CODE_REQUIRED", message: `Code de champ invalide "${code}". Format: ^[a-z][a-z0-9_]*$.` };
    if (!input.label?.trim()) return { code: "FIELD_CODE_REQUIRED", message: "Le label du champ est obligatoire." };

    const dataType = input.data_type || input.dataType;
    if (!dataType || !isTypeValid(dataType))
      return { code: "FIELD_TYPE_INVALID", message: `Type de données non supporté: ${dataType}.` };

    const def = getType(dataType)!;
    if (input.required && !def.supportedValidations.includes("REQUIRED") && dataType !== "FORMULA") {
      // required is generally allowed; keep permissive
    }
    if (input.unique && !def.supportsUnique)
      return { code: "FIELD_TYPE_INVALID", message: `Le type ${dataType} ne supporte pas la contrainte UNIQUE.` };
    if (input.indexed && !def.supportsIndex)
      return { code: "FIELD_TYPE_INVALID", message: `Le type ${dataType} ne supporte pas l'indexation.` };

    const dv = checkDefaultValue(dataType, input.default_value ?? input.defaultValue, input.configuration);
    if (!dv.ok) return { code: "FIELD_DEFAULT_INVALID", message: dv.message! };

    if (input.scope && !SCOPES.includes(input.scope)) return { code: "SCHEMA_INVALID", message: "Scope invalide." };
    if (input.classification && !CLASSIFICATIONS.includes(input.classification))
      return { code: "SCHEMA_INVALID", message: "Classification invalide." };

    // ENUM options
    if (dataType === "ENUM" || dataType === "MULTI_ENUM") {
      const options = input.configuration?.options;
      if (!Array.isArray(options) || options.length === 0)
        return { code: "FIELD_TYPE_INVALID", message: "Un champ ENUM doit déclarer au moins une option {value,label}." };
      const values = options.map((o: any) => o.value);
      if (new Set(values).size !== values.length)
        return { code: "FIELD_TYPE_INVALID", message: "Les valeurs d'options ENUM doivent être uniques." };
    }

    // FORMULA
    if (dataType === "FORMULA") {
      const expr = input.formula_expression || input.formulaExpression || input.configuration?.expression;
      if (!expr) return { code: "FORMULA_INVALID", message: "Une expression est requise pour un champ FORMULA." };
      const types = { ...existingTypes };
      if (selfCode) delete types[selfCode];
      const res = checkFormula(expr, types);
      if (!res.valid)
        return { code: res.errors[0]?.startsWith("FORMULA_REFERENCE_NOT_FOUND") ? "FORMULA_REFERENCE_NOT_FOUND" : "FORMULA_INVALID", message: res.errors.join(" ") };
      return { ok: true, formula: { expression: expr, deps: res.deps, resultType: res.resultType } } as any;
    }

    return { ok: true } as any;
  }

  static async create(appId: string, versionId: string, entityId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const [entity] = await db.select().from(dataEntities).where(eq(dataEntities.id, entityId));
    if (!entity || entity.applicationVersionId !== versionId)
      return { success: false, error: { code: "ENTITY_NOT_FOUND", message: "Entité introuvable." } };

    const types = await this.fieldTypesMap(entityId);
    const code = (input.code || "").trim();
    if (code in types)
      return { success: false, error: { code: "FIELD_CODE_ALREADY_EXISTS", message: `Le champ "${code}" existe déjà dans ${entity.code}.` } };

    const check = this.validateInput(input, types);
    if ("code" in check && !("ok" in check)) return { success: false, error: check as any };

    const positions = await db.select({ p: dataFields.position }).from(dataFields).where(eq(dataFields.entityId, entityId));
    const nextPos = positions.length ? Math.max(...positions.map((x) => x.p)) + 1 : 0;

    const id = randomUUID();
    const isFormula = (input.data_type || input.dataType) === "FORMULA";
    const formula = (check as any).formula;

    const [row] = await db
      .insert(dataFields)
      .values({
        id,
        entityId,
        lineageId: id,
        code,
        label: input.label.trim(),
        description: input.description || null,
        dataType: input.data_type || input.dataType,
        required: !!input.required,
        uniqueFlag: !!input.unique,
        readonly: !!input.readonly,
        indexed: !!input.indexed,
        defaultValue: input.default_value ?? input.defaultValue ?? null,
        position: nextPos,
        scope: input.scope || entity.scope || "ORGANIZATION",
        classification: input.classification || "INTERNAL",
        configuration: input.configuration || {},
        formulaExpression: isFormula ? formula.expression : null,
        formulaResultType: isFormula ? formula.resultType : null,
      })
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.field.created", action: "FIELD_CREATE", targetType: "DATA_FIELD", targetId: row.id,
      after: { code: row.code, dataType: row.dataType, entity: entity.code }, traceId,
    });

    return { success: true, data: { ...row, formulaDeps: isFormula ? formula.deps : [] } };
  }

  static async update(appId: string, versionId: string, entityId: string, fieldId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const [field] = await db.select().from(dataFields).where(and(eq(dataFields.id, fieldId), eq(dataFields.entityId, entityId)));
    if (!field) return { success: false, error: { code: "FIELD_NOT_FOUND", message: "Champ introuvable." } };

    const conflict = versionConflict(field.version, input.expectedVersion);
    if (conflict) return { success: false, error: conflict };

    const types = await this.fieldTypesMap(entityId);
    const newCode = input.code !== undefined ? input.code.trim() : field.code;
    if (newCode !== field.code && newCode in types)
      return { success: false, error: { code: "FIELD_CODE_ALREADY_EXISTS", message: `Le champ "${newCode}" existe déjà.` } };

    const merged = {
      code: newCode,
      label: input.label !== undefined ? input.label : field.label,
      data_type: input.data_type || input.dataType || field.dataType,
      default_value: input.default_value !== undefined ? input.default_value : input.defaultValue !== undefined ? input.defaultValue : field.defaultValue,
      configuration: input.configuration !== undefined ? input.configuration : field.configuration,
      scope: input.scope || field.scope,
      classification: input.classification || field.classification,
      required: input.required !== undefined ? !!input.required : field.required,
      unique: input.unique !== undefined ? !!input.unique : field.uniqueFlag,
      indexed: input.indexed !== undefined ? !!input.indexed : field.indexed,
      formula_expression: input.formula_expression || input.formulaExpression || field.formulaExpression,
    };

    const check = this.validateInput(merged, { ...types, [field.code]: field.dataType === "FORMULA" ? field.formulaResultType || "DECIMAL" : field.dataType }, field.code);
    if ("code" in check && !("ok" in check)) return { success: false, error: check as any };

    const isFormula = merged.data_type === "FORMULA";
    const updates: any = {
      code: merged.code,
      label: merged.label,
      dataType: merged.data_type,
      required: merged.required,
      uniqueFlag: merged.unique,
      indexed: merged.indexed,
      readonly: input.readonly !== undefined ? !!input.readonly : field.readonly,
      defaultValue: merged.default_value,
      scope: merged.scope,
      classification: merged.classification,
      configuration: merged.configuration,
      formulaExpression: isFormula ? (check as any).formula?.expression ?? field.formulaExpression : null,
      formulaResultType: isFormula ? (check as any).formula?.resultType ?? null : null,
      version: field.version + 1,
      updatedAt: new Date(),
    };

    const [row] = await db.update(dataFields).set(updates).where(eq(dataFields.id, fieldId)).returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.field.updated", action: "FIELD_UPDATE", targetType: "DATA_FIELD", targetId: row.id,
      before: { code: field.code, dataType: field.dataType },
      after: { code: row.code, dataType: row.dataType }, traceId,
    });

    return { success: true, data: row };
  }

  static async archive(appId: string, versionId: string, entityId: string, fieldId: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const [field] = await db.select().from(dataFields).where(and(eq(dataFields.id, fieldId), eq(dataFields.entityId, entityId)));
    if (!field) return { success: false, error: { code: "FIELD_NOT_FOUND", message: "Champ introuvable." } };

    // Dependency check: formulas referencing this field
    const all = await db.select().from(dataFields).where(eq(dataFields.entityId, entityId));
    const dependents = all.filter(
      (f) => f.id !== field.id && f.dataType === "FORMULA" && f.formulaExpression && new RegExp(`\\b${field.code}\\b`).test(f.formulaExpression)
    );
    if (dependents.length > 0)
      return {
        success: false,
        error: {
          code: "DEPENDENCY_EXISTS",
          message: `Le champ ${field.code} est utilisé par la/les formule(s): ${dependents.map((d) => d.code).join(", ")}. Supprimez d'abord ces dépendances (BREAKING).`,
        },
      };

    await db.delete(dataValidations).where(eq(dataValidations.fieldId, fieldId));
    const [row] = await db
      .update(dataFields)
      .set({ status: "ARCHIVED", version: field.version + 1, updatedAt: new Date() })
      .where(eq(dataFields.id, fieldId))
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.field.archived", action: "FIELD_ARCHIVE", targetType: "DATA_FIELD", targetId: row.id,
      before: { code: field.code, status: field.status }, after: { status: "ARCHIVED" }, traceId,
    });

    return { success: true, data: row };
  }

  static async reorder(appId: string, versionId: string, entityId: string, orderedIds: string[], actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(dataFields).set({ position: i }).where(and(eq(dataFields.id, orderedIds[i]), eq(dataFields.entityId, entityId)));
    }
    return { success: true };
  }
}
