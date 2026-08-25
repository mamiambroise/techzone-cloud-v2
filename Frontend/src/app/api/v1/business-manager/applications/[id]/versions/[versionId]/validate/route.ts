import { NextRequest } from "next/server";
import { ValidationService } from "@/lib/services/validation.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { AuditService } from "@/lib/services/audit.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id, versionId } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.VALIDATE_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de valider cette version", 403, {}, traceId);
    }

    const validation = await ValidationService.validateApplicationVersion(id, versionId);

    // Audit validation execution
    await AuditService.log({
      applicationId: id,
      actorId: actor.id,
      eventType: "business.application.version.validated",
      action: "VALIDATE",
      targetType: "APPLICATION_VERSION",
      targetId: versionId,
      result: validation.canPublish ? "SUCCESS" : "WARNING",
      metadata: {
        status: validation.status,
        summary: validation.summary,
      },
      traceId,
    });

    return apiSuccess(validation, { trace_id: traceId });
  } catch (error: any) {
    console.error("[POST /validate error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
