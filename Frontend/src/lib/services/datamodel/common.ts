import { db } from "@/db";
import { applicationVersions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AuditService } from "../audit.service";

export const ENTITY_CODE_REGEX = /^[a-z][a-z0-9_]*$/;

export async function loadVersion(appId: string, versionId: string) {
  const [version] = await db
    .select()
    .from(applicationVersions)
    .where(and(eq(applicationVersions.id, versionId), eq(applicationVersions.applicationId, appId)));
  return version || null;
}

export function immutabilityGuard(version: any): { code: string; message: string } | null {
  if (!version) return { code: "DATA_MODEL_NOT_FOUND", message: "Version d'application introuvable." };
  if (version.status === "PUBLISHED" || version.status === "SUPERSEDED") {
    return {
      code: "SCHEMA_IMMUTABLE",
      message: `La version ${version.versionNumber} est ${version.status} : son Data Model est immuable. Créez une nouvelle version DRAFT pour évoluer.`,
    };
  }
  return null;
}

export function versionConflict(current: number, expected?: number): { code: string; message: string } | null {
  if (expected !== undefined && expected !== current) {
    return {
      code: "VERSION_CONFLICT",
      message: `Conflit de version optimiste (attendue: ${expected}, actuelle: ${current}). Rechargez puis réappliquez votre modification.`,
    };
  }
  return null;
}

export async function dmAudit(params: {
  applicationId: string;
  applicationVersionId: string;
  actorId: string;
  eventType: string;
  action: string;
  targetType: string;
  targetId: string;
  result?: "SUCCESS" | "FAILED" | "WARNING";
  before?: any;
  after?: any;
  metadata?: any;
  traceId?: string;
}) {
  await AuditService.log({
    applicationId: params.applicationId,
    actorId: params.actorId,
    eventType: params.eventType,
    action: params.action,
    targetType: params.targetType as any,
    targetId: params.targetId,
    result: params.result || "SUCCESS",
    before: params.before,
    after: params.after,
    metadata: { applicationVersionId: params.applicationVersionId, ...(params.metadata || {}) },
    traceId: params.traceId,
  });
}

export function toModel(row: any, extra: Record<string, any> = {}) {
  return {
    ...row,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
    updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    ...extra,
  };
}
