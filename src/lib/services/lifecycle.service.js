import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ALLOWED_TRANSITIONS, ERROR_CODES } from "../types/domain";
import { AuditService } from "./audit.service";
import { generateTraceId } from "../utils/trace";
export class LifecycleService {
  static getAllowedTransitions(currentStatus) {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }
  static canTransition(currentStatus, targetStatus) {
    const allowed = this.getAllowedTransitions(currentStatus);
    return allowed.includes(targetStatus);
  }
  static async transition(applicationId, targetStatus, actor, comment, expectedVersion, traceId = generateTraceId()) {
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
          message: "L'application est archivée et ne peut plus changer de statut."
        }
      };
    }
    const currentStatus = app.status;
    if (!this.canTransition(currentStatus, targetStatus)) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_STATUS_TRANSITION,
          message: `Transition non autorisée de "${currentStatus}" vers "${targetStatus}". Transitions possibles: ${this.getAllowedTransitions(currentStatus).join(", ") || "aucune"}.`
        }
      };
    }
    const now = new Date();
    const isArchiving = targetStatus === "ARCHIVED";
    const expected = expectedVersion !== undefined ? expectedVersion : app.version;

    // Atomic compare-and-swap: condition the write on the expected version so
    // that two concurrent transition requests can never both silently succeed.
    const [updated] = await db.update(applications).set({
      status: targetStatus,
      archivedAt: isArchiving ? now : app.archivedAt,
      updatedAt: now,
      version: app.version + 1
    }).where(and(eq(applications.id, applicationId), eq(applications.version, expected))).returning();
    if (!updated) {
      const [current] = await db.select().from(applications).where(eq(applications.id, applicationId));
      if (!current) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.APPLICATION_NOT_FOUND,
            message: `Application avec l'ID "${applicationId}" introuvable.`
          }
        };
      }
      return {
        success: false,
        error: {
          code: ERROR_CODES.VERSION_CONFLICT,
          message: `Conflit de version optimiste (version actuelle: ${current.version}, attendue: ${expected}). L'application a été modifiée par un autre utilisateur.`
        }
      };
    }
    await AuditService.log({
      applicationId: app.id,
      actorId: actor.id,
      eventType: isArchiving ? "business.application.archived" : "business.application.status.changed",
      action: isArchiving ? "ARCHIVE" : "TRANSITION",
      targetType: "APPLICATION",
      targetId: app.id,
      result: "SUCCESS",
      before: {
        status: currentStatus,
        version: app.version
      },
      after: {
        status: targetStatus,
        version: updated.version
      },
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        comment: comment || null,
        actorRole: actor.role
      },
      traceId
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
        status: updated.status,
        environment: updated.environment,
        currentVersionId: updated.currentVersionId,
        publishedVersionId: updated.publishedVersionId,
        createdBy: updated.createdBy,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        archivedAt: updated.archivedAt ? updated.archivedAt.toISOString() : null,
        version: updated.version
      }
    };
  }
}