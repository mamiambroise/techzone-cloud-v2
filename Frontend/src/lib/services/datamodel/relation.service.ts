import { db } from "@/db";
import { dataRelations, dataEntities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { loadVersion, immutabilityGuard, versionConflict, dmAudit } from "./common";
import { RELATION_TYPES, DELETE_BEHAVIORS } from "./registry";

export class RelationService {
  static async list(versionId: string) {
    const rows = await db.select().from(dataRelations).where(eq(dataRelations.applicationVersionId, versionId));
    const entities = await db.select().from(dataEntities).where(eq(dataEntities.applicationVersionId, versionId));
    const byId = new Map(entities.map((e) => [e.id, e]));
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      sourceEntity: byId.get(r.sourceEntityId) || null,
      targetEntity: byId.get(r.targetEntityId) || null,
    }));
  }

  static async create(appId: string, versionId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const { sourceEntityId, targetEntityId } = input;
    const relationType = input.relation_type || input.relationType;
    const deleteBehavior = input.delete_behavior || input.deleteBehavior || "RESTRICT";

    if (!RELATION_TYPES.includes(relationType))
      return { success: false, error: { code: "RELATION_INVALID", message: `Type de relation invalide: ${relationType}.` } };
    if (!DELETE_BEHAVIORS.includes(deleteBehavior))
      return { success: false, error: { code: "RELATION_DELETE_BEHAVIOR_INVALID", message: `Comportement de suppression invalide: ${deleteBehavior}.` } };

    const [src] = await db.select().from(dataEntities).where(and(eq(dataEntities.id, sourceEntityId), eq(dataEntities.applicationVersionId, versionId)));
    const [tgt] = await db.select().from(dataEntities).where(and(eq(dataEntities.id, targetEntityId), eq(dataEntities.applicationVersionId, versionId)));
    if (!src || !tgt)
      return { success: false, error: { code: "RELATION_TARGET_NOT_FOUND", message: "Les deux entités de la relation doivent exister dans cette version." } };
    if (src.status === "ARCHIVED" || tgt.status === "ARCHIVED")
      return { success: false, error: { code: "RELATION_INVALID", message: "Impossible de créer une relation vers une entité archivée." } };

    if (input.required && deleteBehavior === "SET_NULL")
      return { success: false, error: { code: "RELATION_INVALID", message: "SET_NULL est incompatible avec une relation obligatoire (required)." } };

    // Exact duplicate check
    const [dup] = await db
      .select({ id: dataRelations.id })
      .from(dataRelations)
      .where(
        and(
          eq(dataRelations.sourceEntityId, sourceEntityId),
          eq(dataRelations.targetEntityId, targetEntityId),
          eq(dataRelations.relationType, relationType)
        )
      );
    if (dup)
      return { success: false, error: { code: "RELATION_INVALID", message: "Cette relation existe déjà entre ces deux entités." } };

    const id = randomUUID();
    const [row] = await db
      .insert(dataRelations)
      .values({
        id,
        applicationVersionId: versionId,
        lineageId: id,
        sourceEntityId,
        targetEntityId,
        relationType,
        sourceLabel: input.source_label || input.sourceLabel || null,
        targetLabel: input.target_label || input.targetLabel || null,
        required: !!input.required,
        deleteBehavior,
      })
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.relation.created", action: "RELATION_CREATE", targetType: "DATA_RELATION", targetId: row.id,
      after: { source: src.code, target: tgt.code, type: relationType, deleteBehavior }, traceId,
    });

    return { success: true, data: { ...row, sourceEntity: src, targetEntity: tgt } };
  }

  static async update(appId: string, versionId: string, relationId: string, input: any, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const [rel] = await db.select().from(dataRelations).where(and(eq(dataRelations.id, relationId), eq(dataRelations.applicationVersionId, versionId)));
    if (!rel) return { success: false, error: { code: "RELATION_NOT_FOUND", message: "Relation introuvable." } };

    const conflict = versionConflict(rel.version, input.expectedVersion);
    if (conflict) return { success: false, error: conflict };

    const deleteBehavior = input.delete_behavior || input.deleteBehavior || rel.deleteBehavior;
    if (!DELETE_BEHAVIORS.includes(deleteBehavior))
      return { success: false, error: { code: "RELATION_DELETE_BEHAVIOR_INVALID", message: "Comportement invalide." } };
    const required = input.required !== undefined ? !!input.required : rel.required;
    if (required && deleteBehavior === "SET_NULL")
      return { success: false, error: { code: "RELATION_INVALID", message: "SET_NULL incompatible avec required." } };

    const [row] = await db
      .update(dataRelations)
      .set({
        relationType: input.relation_type || input.relationType || rel.relationType,
        sourceLabel: input.source_label ?? input.sourceLabel ?? rel.sourceLabel,
        targetLabel: input.target_label ?? input.targetLabel ?? rel.targetLabel,
        required,
        deleteBehavior,
        version: rel.version + 1,
      })
      .where(eq(dataRelations.id, relationId))
      .returning();

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.relation.updated", action: "RELATION_UPDATE", targetType: "DATA_RELATION", targetId: row.id, traceId,
    });
    return { success: true, data: row };
  }

  static async remove(appId: string, versionId: string, relationId: string, actor: any, traceId?: string) {
    const version = await loadVersion(appId, versionId);
    const imm = immutabilityGuard(version);
    if (imm) return { success: false, error: imm };

    const [rel] = await db.select().from(dataRelations).where(and(eq(dataRelations.id, relationId), eq(dataRelations.applicationVersionId, versionId)));
    if (!rel) return { success: false, error: { code: "RELATION_NOT_FOUND", message: "Relation introuvable." } };

    await db.delete(dataRelations).where(eq(dataRelations.id, relationId));

    await dmAudit({
      applicationId: appId, applicationVersionId: versionId, actorId: actor.id,
      eventType: "data.relation.removed", action: "RELATION_REMOVE", targetType: "DATA_RELATION", targetId: relationId, traceId,
    });
    return { success: true };
  }
}
