import { db } from "@/db";
import { applications, applicationVersions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ERROR_CODES } from "../types/domain";
import { AuditService } from "./audit.service";
import { isValidSemver } from "../utils/slug";
import { generateTraceId } from "../utils/trace";
export class VersionService {
  static async listVersions(applicationId) {
    const rows = await db.select().from(applicationVersions).where(eq(applicationVersions.applicationId, applicationId)).orderBy(desc(applicationVersions.createdAt));
    return rows.map(r => ({
      id: r.id,
      applicationId: r.applicationId,
      versionNumber: r.versionNumber,
      status: r.status,
      snapshot: r.snapshot || {},
      comment: r.comment,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      validatedAt: r.validatedAt ? r.validatedAt.toISOString() : null,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      version: r.version
    }));
  }
  static async getVersion(applicationId, versionId) {
    const [row] = await db.select().from(applicationVersions).where(and(eq(applicationVersions.id, versionId), eq(applicationVersions.applicationId, applicationId)));
    if (!row) return null;
    return {
      id: row.id,
      applicationId: row.applicationId,
      versionNumber: row.versionNumber,
      status: row.status,
      snapshot: row.snapshot || {},
      comment: row.comment,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      validatedAt: row.validatedAt ? row.validatedAt.toISOString() : null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      version: row.version
    };
  }
  static async createVersion(applicationId, params, actor, traceId = generateTraceId()) {
    const [app] = await db.select().from(applications).where(eq(applications.id, applicationId));
    if (!app) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application avec l'ID "${applicationId}" introuvable.`
        }
      };
    }
    if (app.status === "ARCHIVED") {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_ARCHIVED,
          message: "Impossible de créer une version pour une application archivée."
        }
      };
    }
    const versionNumber = params.versionNumber.trim();
    if (!isValidSemver(versionNumber)) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_INVALID_NUMBER,
          message: `Le numéro de version "${versionNumber}" est invalide. Format attendu: MAJOR.MINOR.PATCH (ex: 1.0.0, 1.1.0).`
        }
      };
    }

    // Check for duplicate version in this application
    const [existing] = await db.select().from(applicationVersions).where(and(eq(applicationVersions.applicationId, applicationId), eq(applicationVersions.versionNumber, versionNumber)));
    if (existing) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_ALREADY_EXISTS,
          message: `La version "${versionNumber}" existe déjà pour cette application.`
        }
      };
    }

    // Build snapshot from source version or default template
    let baseSnapshot = {
      appName: app.name,
      appCode: app.code,
      category: app.category,
      icon: app.icon,
      environment: app.environment,
      dataModels: [],
      features: [],
      menus: [{
        id: "menu_home",
        label: "Accueil",
        path: "/"
      }, {
        id: "menu_main",
        label: "Gestion Principale",
        path: "/main"
      }],
      pages: [],
      forms: [],
      dashboards: [],
      rules: [],
      workflows: [],
      automations: []
    };
    if (params.snapshot) {
      baseSnapshot = {
        ...baseSnapshot,
        ...params.snapshot
      };
    } else if (params.sourceVersionId) {
      const sourceVer = await this.getVersion(applicationId, params.sourceVersionId);
      if (sourceVer?.snapshot) {
        baseSnapshot = {
          ...sourceVer.snapshot,
          baseSourceVersion: sourceVer.versionNumber
        };
      }
    } else if (app.currentVersionId) {
      const currentVer = await this.getVersion(applicationId, app.currentVersionId);
      if (currentVer?.snapshot) {
        baseSnapshot = {
          ...currentVer.snapshot,
          baseSourceVersion: currentVer.versionNumber
        };
      }
    }
    const [created] = await db.insert(applicationVersions).values({
      applicationId,
      versionNumber,
      status: "DRAFT",
      snapshot: baseSnapshot,
      comment: params.comment || `Création de la version ${versionNumber}`,
      createdBy: actor.id
    }).returning();

    // Update application currentVersionId & touch updatedAt
    await db.update(applications).set({
      currentVersionId: created.id,
      updatedAt: new Date(),
      version: app.version + 1
    }).where(eq(applications.id, applicationId));
    await AuditService.log({
      applicationId: app.id,
      actorId: actor.id,
      eventType: "business.application.version.created",
      action: "VERSION_CREATE",
      targetType: "APPLICATION_VERSION",
      targetId: created.id,
      result: "SUCCESS",
      after: {
        versionId: created.id,
        versionNumber: created.versionNumber,
        status: created.status
      },
      metadata: {
        versionNumber: created.versionNumber,
        sourceVersionId: params.sourceVersionId || null,
        comment: params.comment || null
      },
      traceId
    });
    return {
      success: true,
      data: {
        id: created.id,
        applicationId: created.applicationId,
        versionNumber: created.versionNumber,
        status: created.status,
        snapshot: created.snapshot,
        comment: created.comment,
        createdBy: created.createdBy,
        createdAt: created.createdAt.toISOString(),
        validatedAt: null,
        publishedAt: null,
        version: created.version
      }
    };
  }
  static async compareVersions(applicationId, v1Id, v2Id) {
    const v1 = await this.getVersion(applicationId, v1Id);
    const v2 = await this.getVersion(applicationId, v2Id);
    const diff = {
      versionNumbers: {
        v1: v1?.versionNumber,
        v2: v2?.versionNumber
      },
      statuses: {
        v1: v1?.status,
        v2: v2?.status
      },
      createdAt: {
        v1: v1?.createdAt,
        v2: v2?.createdAt
      },
      publishedAt: {
        v1: v1?.publishedAt,
        v2: v2?.publishedAt
      },
      snapshotDiff: {
        v1Keys: v1?.snapshot ? Object.keys(v1.snapshot) : [],
        v2Keys: v2?.snapshot ? Object.keys(v2.snapshot) : []
      }
    };
    return {
      v1,
      v2,
      diff
    };
  }
}