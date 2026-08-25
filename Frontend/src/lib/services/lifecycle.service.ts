import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ALLOWED_TRANSITIONS, ApplicationModel, ApplicationStatus, ERROR_CODES } from "../types/domain";
import { ActorContext } from "./auth.service";
import { AuditService } from "./audit.service";
import { generateTraceId } from "../utils/trace";

export class LifecycleService {
  static getAllowedTransitions(currentStatus: ApplicationStatus): ApplicationStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }

  static canTransition(currentStatus: ApplicationStatus, targetStatus: ApplicationStatus): boolean {
    const allowed = this.getAllowedTransitions(currentStatus);
    return allowed.includes(targetStatus);
  }

  static async transition(
    applicationId: string,
    targetStatus: ApplicationStatus,
    actor: ActorContext,
    comment?: string,
    expectedVersion?: number,
    traceId = generateTraceId()
  ): Promise<{ success: boolean; data?: ApplicationModel; error?: { code: string; message: string } }> {
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
          message: "L'application est archivée et ne peut plus changer de statut.",
        },
      };
    }

    if (expectedVersion !== undefined && app.version !== expectedVersion) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_CONFLICT,
          message: "Conflit de version optimiste. L'application a été modifiée par un autre utilisateur.",
        },
      };
    }

    const currentStatus = app.status as ApplicationStatus;
    if (!this.canTransition(currentStatus, targetStatus)) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_STATUS_TRANSITION,
          message: `Transition non autorisée de "${currentStatus}" vers "${targetStatus}". Transitions possibles: ${this.getAllowedTransitions(
            currentStatus
          ).join(", ") || "aucune"}.`,
        },
      };
    }

    const now = new Date();
    const isArchiving = targetStatus === "ARCHIVED";

    const [updated] = await db
      .update(applications)
      .set({
        status: targetStatus,
        archivedAt: isArchiving ? now : app.archivedAt,
        updatedAt: now,
        version: app.version + 1,
      })
      .where(eq(applications.id, applicationId))
      .returning();

    await AuditService.log({
      applicationId: app.id,
      actorId: actor.id,
      eventType: isArchiving ? "business.application.archived" : "business.application.status.changed",
      action: isArchiving ? "ARCHIVE" : "TRANSITION",
      targetType: "APPLICATION",
      targetId: app.id,
      result: "SUCCESS",
      before: { status: currentStatus, version: app.version },
      after: { status: targetStatus, version: updated.version },
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        comment: comment || null,
        actorRole: actor.role,
      },
      traceId,
    });

    return {
      success: true,
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        category: updated.category,
        icon: updated.icon,
        status: updated.status as ApplicationStatus,
        environment: updated.environment as any,
        currentVersionId: updated.currentVersionId,
        publishedVersionId: updated.publishedVersionId,
        createdBy: updated.createdBy,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        archivedAt: updated.archivedAt ? updated.archivedAt.toISOString() : null,
        version: updated.version,
      },
    };
  }
}
