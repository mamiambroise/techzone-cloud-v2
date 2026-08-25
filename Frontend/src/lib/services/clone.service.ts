import { db } from "@/db";
import { applications, applicationVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApplicationModel, ERROR_CODES } from "../types/domain";
import { ActorContext } from "./auth.service";
import { AuditService } from "./audit.service";
import { isValidApplicationCode, slugifyCode } from "../utils/slug";
import { generateTraceId } from "../utils/trace";

export interface CloneApplicationParams {
  newName: string;
  newCode: string;
  category?: string;
  description?: string;
  icon?: string;
}

export class CloneService {
  static async cloneApplication(
    sourceApplicationId: string,
    params: CloneApplicationParams,
    actor: ActorContext,
    traceId = generateTraceId()
  ): Promise<{ success: boolean; data?: ApplicationModel; error?: { code: string; message: string } }> {
    // 1. Get source application
    const [sourceApp] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, sourceApplicationId));

    if (!sourceApp) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_NOT_FOUND,
          message: `Application source avec l'ID "${sourceApplicationId}" introuvable.`,
        },
      };
    }

    const newName = (params.newName || `${sourceApp.name} (Clone)`).trim();
    let newCode = (params.newCode || slugifyCode(newName)).trim();

    if (!isValidApplicationCode(newCode)) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_INVALID_CODE,
          message: `Le code technique "${newCode}" est invalide. Format attendu: kebab-case (ex: boutique-premium).`,
        },
      };
    }

    // Check code uniqueness
    const [existingWithCode] = await db
      .select()
      .from(applications)
      .where(eq(applications.code, newCode));

    if (existingWithCode) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.APPLICATION_CODE_ALREADY_EXISTS,
          message: `Une application avec le code "${newCode}" existe déjà.`,
        },
      };
    }

    // 2. Fetch source current/published version snapshot if available
    let sourceSnapshot: Record<string, any> = {
      appName: newName,
      appCode: newCode,
      category: params.category || sourceApp.category,
      icon: params.icon || sourceApp.icon,
      dataModels: [],
      features: [],
      menus: [{ id: "menu_home", label: "Accueil", path: "/" }],
      pages: [],
      forms: [],
      dashboards: [],
      rules: [],
      workflows: [],
      automations: [],
    };

    const sourceVerId = sourceApp.publishedVersionId || sourceApp.currentVersionId;
    if (sourceVerId) {
      const [sourceVersion] = await db
        .select()
        .from(applicationVersions)
        .where(eq(applicationVersions.id, sourceVerId));

      if (sourceVersion?.snapshot) {
        sourceSnapshot = {
          ...(sourceVersion.snapshot as Record<string, any>),
          clonedFrom: {
            appId: sourceApp.id,
            appCode: sourceApp.code,
            appName: sourceApp.name,
            versionNumber: sourceVersion.versionNumber,
          },
        };
      }
    }

    const now = new Date();

    // 3. Insert new Application
    const [newApp] = await db
      .insert(applications)
      .values({
        name: newName,
        code: newCode,
        description: params.description ?? sourceApp.description ?? `Clone de ${sourceApp.name}`,
        category: params.category ?? sourceApp.category ?? "Autre",
        icon: params.icon ?? sourceApp.icon ?? "Package",
        status: "DRAFT",
        environment: sourceApp.environment ?? "DEVELOPMENT",
        createdBy: actor.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
      })
      .returning();

    // 4. Insert initial version
    const [initialVersion] = await db
      .insert(applicationVersions)
      .values({
        applicationId: newApp.id,
        versionNumber: "1.0.0",
        status: "DRAFT",
        snapshot: sourceSnapshot,
        comment: `Version initiale issue du clonage de ${sourceApp.name} (${sourceApp.code})`,
        createdBy: actor.id,
        createdAt: now,
        version: 1,
      })
      .returning();

    // 5. Update cloned application currentVersionId
    const [finalApp] = await db
      .update(applications)
      .set({
        currentVersionId: initialVersion.id,
        updatedAt: now,
      })
      .where(eq(applications.id, newApp.id))
      .returning();

    // 6. Audit event
    await AuditService.log({
      applicationId: finalApp.id,
      actorId: actor.id,
      eventType: "business.application.cloned",
      action: "CLONE",
      targetType: "APPLICATION",
      targetId: finalApp.id,
      result: "SUCCESS",
      after: {
        id: finalApp.id,
        code: finalApp.code,
        name: finalApp.name,
        initialVersion: initialVersion.versionNumber,
      },
      metadata: {
        sourceApplicationId: sourceApp.id,
        sourceApplicationCode: sourceApp.code,
        sourceApplicationName: sourceApp.name,
      },
      traceId,
    });

    return {
      success: true,
      data: {
        id: finalApp.id,
        code: finalApp.code,
        name: finalApp.name,
        description: finalApp.description,
        category: finalApp.category,
        icon: finalApp.icon,
        status: finalApp.status as any,
        environment: finalApp.environment as any,
        currentVersionId: finalApp.currentVersionId,
        publishedVersionId: null,
        createdBy: finalApp.createdBy,
        createdAt: finalApp.createdAt.toISOString(),
        updatedAt: finalApp.updatedAt.toISOString(),
        archivedAt: null,
        version: finalApp.version,
        currentVersionNumber: initialVersion.versionNumber,
      },
    };
  }
}
