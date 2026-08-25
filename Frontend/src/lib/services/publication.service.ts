import { db } from "@/db";
import { applications, applicationVersions, publications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Environment, ERROR_CODES, PublicationModel } from "../types/domain";
import { ActorContext } from "./auth.service";
import { AuditService } from "./audit.service";
import { ValidationService } from "./validation.service";
import { generateTraceId } from "../utils/trace";

export class PublicationService {
  static async publishVersion(
    applicationId: string,
    versionId: string,
    environment?: Environment,
    actor?: ActorContext,
    traceId = generateTraceId()
  ): Promise<{
    success: boolean;
    data?: {
      publication: PublicationModel;
      applicationStatus: string;
      versionNumber: string;
    };
    error?: { code: string; message: string; details?: any };
  }> {
    const actorContext = actor || {
      id: "usr_admin_01",
      name: "Administrateur Business",
      email: "admin@businessmanager.io",
      role: "ADMIN" as const,
    };

    // 1. Load application
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!app) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application avec l'ID "${applicationId}" introuvable.`,
        },
      };
    }

    if (app.status === "ARCHIVED") {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_ARCHIVED,
          message: "Impossible de publier une version pour une application archivée.",
        },
      };
    }

    // 2. Load version
    const [ver] = await db
      .select()
      .from(applicationVersions)
      .where(and(eq(applicationVersions.id, versionId), eq(applicationVersions.applicationId, applicationId)));

    if (!ver) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_NOT_FOUND,
          message: `Version avec l'ID "${versionId}" introuvable pour cette application.`,
        },
      };
    }

    // 3. Validate version
    const validationResult = await ValidationService.validateApplicationVersion(applicationId, versionId);
    if (!validationResult.canPublish) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_FAILED,
          message: "La validation a échoué. Corrigez les blocages critiques avant de publier.",
          details: validationResult,
        },
      };
    }

    const targetEnv: Environment = environment || (app.environment as Environment) || "DEVELOPMENT";
    const previousPublishedId = app.publishedVersionId;
    const now = new Date();

    // 4. Update previous version if any
    if (previousPublishedId && previousPublishedId !== versionId) {
      await db
        .update(applicationVersions)
        .set({ status: "SUPERSEDED" })
        .where(eq(applicationVersions.id, previousPublishedId));
    }

    // 5. Create Publication record
    const [pub] = await db
      .insert(publications)
      .values({
        applicationId: app.id,
        versionId: ver.id,
        environment: targetEnv,
        type: "PUBLISH",
        status: "SUCCESS",
        previousVersionId: previousPublishedId ?? null,
        publishedBy: actorContext.id,
        publishedAt: now,
        result: {
          validationSummary: validationResult.summary,
          versionNumber: ver.versionNumber,
          targetEnv,
        },
      })
      .returning();

    // 6. Mark version published
    await db
      .update(applicationVersions)
      .set({
        status: "PUBLISHED",
        publishedAt: now,
        version: ver.version + 1,
      })
      .where(eq(applicationVersions.id, ver.id));

    // 7. Update Application status -> ACTIVE & publishedVersionId
    const [updatedApp] = await db
      .update(applications)
      .set({
        publishedVersionId: ver.id,
        currentVersionId: ver.id,
        status: "ACTIVE",
        environment: targetEnv,
        updatedAt: now,
        version: app.version + 1,
      })
      .where(eq(applications.id, app.id))
      .returning();

    // 8. Record audit log
    await AuditService.log({
      applicationId: app.id,
      actorId: actorContext.id,
      eventType: "business.application.published",
      action: "PUBLISH",
      targetType: "PUBLICATION",
      targetId: pub.id,
      result: "SUCCESS",
      before: {
        publishedVersionId: previousPublishedId,
        status: app.status,
      },
      after: {
        publishedVersionId: ver.id,
        status: updatedApp.status,
      },
      metadata: {
        versionId: ver.id,
        versionNumber: ver.versionNumber,
        environment: targetEnv,
        publicationId: pub.id,
      },
      traceId,
    });

    return {
      success: true,
      data: {
        publication: {
          id: pub.id,
          applicationId: pub.applicationId,
          versionId: pub.versionId,
          environment: pub.environment as Environment,
          type: pub.type as any,
          status: pub.status as any,
          previousVersionId: pub.previousVersionId,
          publishedBy: pub.publishedBy,
          publishedAt: pub.publishedAt.toISOString(),
          result: pub.result as any,
          versionNumber: ver.versionNumber,
        },
        applicationStatus: updatedApp.status,
        versionNumber: ver.versionNumber,
      },
    };
  }

  static async rollbackToVersion(
    applicationId: string,
    targetVersionId: string,
    environment?: Environment,
    actor?: ActorContext,
    traceId = generateTraceId()
  ): Promise<{
    success: boolean;
    data?: {
      publication: PublicationModel;
      applicationStatus: string;
      restoredVersionNumber: string;
    };
    error?: { code: string; message: string; details?: any };
  }> {
    const actorContext = actor || {
      id: "usr_admin_01",
      name: "Administrateur Business",
      email: "admin@businessmanager.io",
      role: "ADMIN" as const,
    };

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!app) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application avec l'ID "${applicationId}" introuvable.`,
        },
      };
    }

    if (app.status === "ARCHIVED") {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_ARCHIVED,
          message: "Impossible d'effectuer un rollback sur une application archivée.",
        },
      };
    }

    const [targetVer] = await db
      .select()
      .from(applicationVersions)
      .where(and(eq(applicationVersions.id, targetVersionId), eq(applicationVersions.applicationId, applicationId)));

    if (!targetVer) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_NOT_FOUND,
          message: `Version cible "${targetVersionId}" introuvable pour cette application.`,
        },
      };
    }

    const previousPublishedId = app.publishedVersionId;
    if (previousPublishedId === targetVersionId) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.ROLLBACK_FAILED,
          message: `La version "${targetVer.versionNumber}" est déjà la version active actuellement publiée.`,
        },
      };
    }

    const now = new Date();
    const targetEnv: Environment = environment || (app.environment as Environment) || "DEVELOPMENT";

    // Mark current published version as SUPERSEDED
    if (previousPublishedId) {
      await db
        .update(applicationVersions)
        .set({ status: "SUPERSEDED" })
        .where(eq(applicationVersions.id, previousPublishedId));
    }

    // Set target version as PUBLISHED
    await db
      .update(applicationVersions)
      .set({
        status: "PUBLISHED",
        publishedAt: now,
        version: targetVer.version + 1,
      })
      .where(eq(applicationVersions.id, targetVer.id));

    // Create Rollback Publication record
    const [pub] = await db
      .insert(publications)
      .values({
        applicationId: app.id,
        versionId: targetVer.id,
        environment: targetEnv,
        type: "ROLLBACK",
        status: "SUCCESS",
        previousVersionId: previousPublishedId ?? null,
        publishedBy: actorContext.id,
        publishedAt: now,
        result: {
          action: "ROLLBACK",
          targetVersionNumber: targetVer.versionNumber,
          previousPublishedVersionId: previousPublishedId,
        },
      })
      .returning();

    // Update Application
    const [updatedApp] = await db
      .update(applications)
      .set({
        publishedVersionId: targetVer.id,
        status: "ACTIVE",
        environment: targetEnv,
        updatedAt: now,
        version: app.version + 1,
      })
      .where(eq(applications.id, app.id))
      .returning();

    // Record audit event
    await AuditService.log({
      applicationId: app.id,
      actorId: actorContext.id,
      eventType: "business.application.rollback",
      action: "ROLLBACK",
      targetType: "PUBLICATION",
      targetId: pub.id,
      result: "SUCCESS",
      before: {
        publishedVersionId: previousPublishedId,
      },
      after: {
        publishedVersionId: targetVer.id,
        status: updatedApp.status,
      },
      metadata: {
        restoredVersionId: targetVer.id,
        restoredVersionNumber: targetVer.versionNumber,
        previousVersionId: previousPublishedId,
        publicationId: pub.id,
      },
      traceId,
    });

    return {
      success: true,
      data: {
        publication: {
          id: pub.id,
          applicationId: pub.applicationId,
          versionId: pub.versionId,
          environment: pub.environment as Environment,
          type: pub.type as any,
          status: pub.status as any,
          previousVersionId: pub.previousVersionId,
          publishedBy: pub.publishedBy,
          publishedAt: pub.publishedAt.toISOString(),
          result: pub.result as any,
          versionNumber: targetVer.versionNumber,
        },
        applicationStatus: updatedApp.status,
        restoredVersionNumber: targetVer.versionNumber,
      },
    };
  }

  static async listPublications(applicationId: string): Promise<PublicationModel[]> {
    const rows = await db
      .select({
        pub: publications,
        verNum: applicationVersions.versionNumber,
      })
      .from(publications)
      .leftJoin(applicationVersions, eq(publications.versionId, applicationVersions.id))
      .where(eq(publications.applicationId, applicationId))
      .orderBy(eq(publications.publishedAt, publications.publishedAt));

    return rows.map((r) => ({
      id: r.pub.id,
      applicationId: r.pub.applicationId,
      versionId: r.pub.versionId,
      environment: r.pub.environment as any,
      type: r.pub.type as any,
      status: r.pub.status as any,
      previousVersionId: r.pub.previousVersionId,
      publishedBy: r.pub.publishedBy,
      publishedAt: r.pub.publishedAt.toISOString(),
      result: r.pub.result as any,
      versionNumber: r.verNum || undefined,
    }));
  }
}
