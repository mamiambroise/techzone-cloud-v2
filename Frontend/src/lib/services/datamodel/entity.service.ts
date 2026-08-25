import { db } from "@/db";
import { dataEntities, dataFields, dataConstraints, dataIndexes, dataValidations } from "@/db/schema";
import { eq, and, ilike, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ENTITY_CODE_REGEX, loadVersion, immutabilityGuard, versionConflict, dmAudit } from "./common";
import { SCOPES, CLASSIFICATIONS } from "./registry";

export class EntityService {
  static async list(versionId: string, search?: string) {
    const conds = [eq(dataEntities.applicationVersionId, versionId)];
    if (search) conds.push(ilike(dataEntities.name, `%${search}%`) as any);
    const rows = await db.select().from(dataEntities).where(and(...conds)).orderBy(asc(dataEntities.position), asc(dataEntities.name));

    // Attach field/relation counts
    const result = [];
    for (const e of rows) {
      const fields = await db.select({ id: dataFields.id }).from(dataFields).where(eq(dataFields.entityId, e.id));
      result.push({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        fieldsCount: fields.length,
      });
    }
    return result;
  }

  static async get(versionId: string, entityId: string) {
    const [row] = await db
      .select()
      .from(dataEntities)
      .where(and(eq(dataEntities.id, entityId), eq(dataEntities.applicationVersionId, versionId)));
    return row || null;
  }

  static async create(appId: string, versionId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const code = (input.code || "").trim();
    const name = (input.name || "").trim();
    if (!code) return { success: false, error: { code: "ENTITY_CODE_REQUIRED", message: "Le code technique de l'entité est obligatoire." } };
    if (!ENTITY_CODE_REGEX.test(code))
      return {
        success: false,
        error: { code: "ENTITY_CODE_INVALID", message: `Code invalide "${code}". Format: ^[a-z][a-z0-9_]*$ (ex: product, order_line).` },
      };
    if (!name) return { success: false, error: { code: "ENTITY_CODE_REQUIRED", message: "Le nom affiché de l'entité est obligatoire." } };

    const [dup] = await db
      .select({ id: dataEntities.id })
      .from(dataEntities)
      .where(and(eq(dataEntities.applicationVersionId, versionId), eq(dataEntities.code, code)));
    if (dup)
      return { success: false, error: { code: "ENTITY_CODE_ALREADY_EXISTS", message: `L'entité "${code}" existe déjà dans cette version.` } };

    if (input.scope && !SCOPES.includes(input.scope))
      return { success: false, error: { code: "SCHEMA_INVALID", message: `Scope invalide: ${input.scope}` } };
    if (input.classification && !CLASSIFICATIONS.includes(input.classification))
      return { success: false, error: { code: "SCHEMA_INVALID", message: `Classification invalide: ${input.classification}` } };

    const id = randomUUID();
    const [row] = await db
      .insert(dataEntities)
      .values({
        id,
        applicationId: appId,
        applicationVersionId: versionId,
        lineageId: id,
        code,
        name,
        pluralName: input.plural_name || input.pluralName || `${name}s`,
        description: input.description || null,
        icon: input.icon || "Database",
        scope: input.scope || "ORGANIZATION",
        classification: input.classification || "INTERNAL",
        createdBy: actor.id,
      })
      .returning();

    await dmAudit({
      applicationId: appId,
      applicationVersionId: versionId,
      actorId: actor.id,
      eventType: "data.entity.created",
      action: "ENTITY_CREATE",
      targetType: "DATA_ENTITY",
      targetId: row.id,
      after: { code: row.code, name: row.name },
      traceId,
    });

    return { success: true, data: row };
  }

  static async update(appId: string, versionId: string, entityId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const entity = await this.get(versionId, entityId);
    if (!entity) return { success: false, error: { code: "ENTITY_NOT_FOUND", message: "Entité introuvable dans cette version." } };

    const conflict = versionConflict(entity.version, input.expectedVersion);
    if (conflict) return { success: false, error: conflict };

    const updates: any = { updatedAt: new Date(), version: entity.version + 1 };
    if (input.code !== undefined) {
      const code = input.code.trim();
      if (!ENTITY_CODE_REGEX.test(code))
        return { success: false, error: { code: "ENTITY_CODE_INVALID", message: `Code invalide "${code}".` } };
      if (code !== entity.code) {
        const [dup] = await db
          .select({ id: dataEntities.id })
          .from(dataEntities)
          .where(and(eq(dataEntities.applicationVersionId, versionId), eq(dataEntities.code, code)));
        if (dup)
          return { success: false, error: { code: "ENTITY_CODE_ALREADY_EXISTS", message: `L'entité "${code}" existe déjà.` } };
      }
      updates.code = code;
    }
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.plural_name !== undefined || input.pluralName !== undefined)
      updates.pluralName = input.plural_name ?? input.pluralName;
    if (input.description !== undefined) updates.description = input.description;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.scope !== undefined) {
      if (!SCOPES.includes(input.scope)) return { success: false, error: { code: "SCHEMA_INVALID", message: `Scope invalide.` } };
      updates.scope = input.scope;
    }
    if (input.classification !== undefined) {
      if (!CLASSIFICATIONS.includes(input.classification))
        return { success: false, error: { code: "SCHEMA_INVALID", message: `Classification invalide.` } };
      updates.classification = input.classification;
    }

    const [row] = await db.update(dataEntities).set(updates).where(eq(dataEntities.id, entityId)).returning();

    await dmAudit({
      applicationId: appId,
      applicationVersionId: versionId,
      actorId: actor.id,
      eventType: "data.entity.updated",
      action: "ENTITY_UPDATE",
      targetType: "DATA_ENTITY",
      targetId: row.id,
      before: { code: entity.code, name: entity.name, scope: entity.scope },
      after: { code: row.code, name: row.name, scope: row.scope },
      traceId,
    });

    return { success: true, data: row };
  }

  static async duplicate(appId: string, versionId: string, entityId: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const entity = await this.get(versionId, entityId);
    if (!entity) return { success: false, error: { code: "ENTITY_NOT_FOUND", message: "Entité introuvable." } };

    let code = `${entity.code}_copy`;
    let n = 2;
    for (;;) {
      const [dup] = await db
        .select({ id: dataEntities.id })
        .from(dataEntities)
        .where(and(eq(dataEntities.applicationVersionId, versionId), eq(dataEntities.code, code)));
      if (!dup) break;
      code = `${entity.code}_copy_${n++}`;
    }

    const newId = randomUUID();
    const [clone] = await db
      .insert(dataEntities)
      .values({
        ...entity,
        id: newId,
        lineageId: newId,
        code,
        name: `${entity.name} (copie)`,
        pluralName: entity.pluralName ? `${entity.pluralName} (copie)` : null,
        version: 1,
        createdBy: actor.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Copy fields
    const fields = await db.select().from(dataFields).where(eq(dataFields.entityId, entityId));
    for (const f of fields) {
      const fid = randomUUID();
      await db.insert(dataFields).values({ ...f, id: fid, lineageId: fid, entityId: clone.id, version: 1, createdAt: new Date(), updatedAt: new Date() });
    }

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.entity.created", action: "ENTITY_DUPLICATE", targetType: "DATA_ENTITY", targetId: clone.id,
      metadata: { sourceEntityId: entityId }, traceId,
    });

    return { success: true, data: clone };
  }

  static async archive(appId: string, versionId: string, entityId: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const entity = await this.get(versionId, entityId);
    if (!entity) return { success: false, error: { code: "ENTITY_NOT_FOUND", message: "Entité introuvable." } };

    const [row] = await db
      .update(dataEntities)
      .set({ status: "ARCHIVED", updatedAt: new Date(), version: entity.version + 1 })
      .where(eq(dataEntities.id, entityId))
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.entity.archived", action: "ENTITY_ARCHIVE", targetType: "DATA_ENTITY", targetId: row.id,
      before: { status: entity.status }, after: { status: "ARCHIVED" }, traceId,
    });

    return { success: true, data: row };
  }
}
