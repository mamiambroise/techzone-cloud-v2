import { db } from "@/db";
import { dataConstraints, dataIndexes, dataValidations, dataFields, dataEntities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { loadVersion, immutabilityGuard, dmAudit } from "./common";
import { CONSTRAINT_TYPES, INDEX_TYPES, VALIDATION_TYPES, getType } from "./registry";

async function entityFieldsOk(entityId: string, fieldIds: string[]) {
  const fields = await db.select().from(dataFields).where(eq(dataFields.entityId, entityId));
  const ids = new Set(fields.map((f) => f.id));
  for (const fid of fieldIds) if (!ids.has(fid)) return false;
  return true;
}

export class ConstraintService {
  static async list(entityId: string) {
    return db.select().from(dataConstraints).where(eq(dataConstraints.entityId, entityId));
  }

  static async create(appId: string, versionId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const type = input.type;
    if (!CONSTRAINT_TYPES.includes(type))
      return { success: false, error: { code: "CONSTRAINT_INVALID", message: `Type de contrainte invalide: ${type}.` } };

    const fieldIds: string[] = Array.isArray(input.field_ids || input.fieldIds) ? (input.field_ids || input.fieldIds) : [];
    if (type === "COMPOSITE_UNIQUE" && fieldIds.length < 2)
      return { success: false, error: { code: "CONSTRAINT_INVALID", message: "COMPOSITE_UNIQUE exige au moins 2 champs de la même entité." } };
    if (["UNIQUE", "NOT_NULL", "VALUE_RANGE", "FORMAT"].includes(type) && fieldIds.length !== 1)
      return { success: false, error: { code: "CONSTRAINT_INVALID", message: `La contrainte ${type} exige exactement 1 champ.` } };

    if (fieldIds.length > 0 && !(await entityFieldsOk(input.entityId, fieldIds)))
      return { success: false, error: { code: "CONSTRAINT_INVALID", message: "Tous les champs doivent appartenir à la même entité." } };

    const [row] = await db
      .insert(dataConstraints)
      .values({
        entityId: input.entityId,
        type,
        name: input.name || `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`,
        fieldIds,
        configuration: input.configuration || {},
      })
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.schema.changed", action: "CONSTRAINT_CREATE", targetType: "DATA_CONSTRAINT", targetId: row.id,
      after: { type, name: row.name }, traceId,
    });
    return { success: true, data: row };
  }

  static async remove(appId: string, versionId: string, id: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };
    await db.delete(dataConstraints).where(eq(dataConstraints.id, id));
    await dmAudit({ applicationId: appId, applicationVersionId: versionId, actorId: actor.id, eventType: "data.schema.changed", action: "CONSTRAINT_REMOVE", targetType: "DATA_CONSTRAINT", targetId: id, traceId });
    return { success: true };
  }
}

export class IndexService {
  static async list(entityId: string) {
    return db.select().from(dataIndexes).where(eq(dataIndexes.entityId, entityId));
  }

  static async create(appId: string, versionId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const type = input.type || "SIMPLE";
    if (!INDEX_TYPES.includes(type))
      return { success: false, error: { code: "INDEX_INVALID", message: `Type d'index invalide: ${type}.` } };
    const fieldIds: string[] = input.field_ids || input.fieldIds || [];
    if (fieldIds.length === 0)
      return { success: false, error: { code: "INDEX_INVALID", message: "Un index exige au moins un champ." } };
    if (type === "COMPOSITE" && fieldIds.length < 2)
      return { success: false, error: { code: "INDEX_INVALID", message: "Un index COMPOSITE exige au moins 2 champs." } };
    if (!(await entityFieldsOk(input.entityId, fieldIds)))
      return { success: false, error: { code: "INDEX_INVALID", message: "Les champs de l'index doivent appartenir à la même entité." } };

    const [row] = await db
      .insert(dataIndexes)
      .values({ entityId: input.entityId, name: input.name || `idx_${Date.now().toString().slice(-5)}`, type, fieldIds })
      .returning();

    await dmAudit({ applicationId: appId, applicationVersionId: versionId, actorId: actor.id, eventType: "data.schema.changed", action: "INDEX_CREATE", targetType: "DATA_INDEX", targetId: row.id, after: { type, name: row.name }, traceId });
    return { success: true, data: row };
  }

  static async remove(appId: string, versionId: string, id: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };
    await db.delete(dataIndexes).where(eq(dataIndexes.id, id));
    await dmAudit({ applicationId: appId, applicationVersionId: versionId, actorId: actor.id, eventType: "data.schema.changed", action: "INDEX_REMOVE", targetType: "DATA_INDEX", targetId: id, traceId });
    return { success: true };
  }
}

export class ValidationServiceDM {
  static async list(fieldId?: string) {
    if (fieldId) return db.select().from(dataValidations).where(eq(dataValidations.fieldId, fieldId));
    return db.select().from(dataValidations);
  }

  static async create(appId: string, versionId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const type = input.type;
    if (!VALIDATION_TYPES.includes(type))
      return { success: false, error: { code: "VALIDATION_INVALID", message: `Type de validation invalide: ${type}.` } };

    const [field] = await db.select().from(dataFields).where(eq(dataFields.id, input.fieldId));
    if (!field) return { success: false, error: { code: "FIELD_NOT_FOUND", message: "Champ introuvable pour cette validation." } };

    const def = getType(field.dataType);
    if (def && !def.supportedValidations.includes(type) && type !== "REQUIRED")
      return {
        success: false,
        error: { code: "VALIDATION_INVALID", message: `La validation ${type} n'est pas compatible avec le type ${field.dataType}.` },
      };

    const [row] = await db
      .insert(dataValidations)
      .values({
        fieldId: input.fieldId,
        type,
        configuration: input.configuration || {},
        errorCode: input.error_code || input.errorCode || null,
        message: input.message || null,
      })
      .returning();

    await dmAudit({ applicationId: appId, applicationVersionId: versionId, actorId: actor.id, eventType: "data.schema.changed", action: "VALIDATION_CREATE", targetType: "DATA_VALIDATION", targetId: row.id, after: { type, field: field.code }, traceId });
    return { success: true, data: row };
  }

  static async remove(appId: string, versionId: string, id: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };
    await db.delete(dataValidations).where(eq(dataValidations.id, id));
    await dmAudit({ applicationId: appId, applicationVersionId: versionId, actorId: actor.id, eventType: "data.schema.changed", action: "VALIDATION_REMOVE", targetType: "DATA_VALIDATION", targetId: id, traceId });
    return { success: true };
  }
}
