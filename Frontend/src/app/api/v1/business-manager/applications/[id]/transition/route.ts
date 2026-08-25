import { NextRequest } from "next/server";
import { LifecycleService } from "@/lib/services/lifecycle.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de changer le statut de cette application", 403, {}, traceId);
    }

    const body = await request.json();
    const { targetStatus, comment, expectedVersion } = body;

    if (!targetStatus) {
      return apiError(ERROR_CODES.INVALID_REQUEST, "Le paramètre targetStatus est obligatoire", 400, {}, traceId);
    }

    const result = await LifecycleService.transition(
      id,
      targetStatus,
      actor,
      comment,
      expectedVersion,
      traceId
    );

    if (!result.success) {
      const statusCode = result.error!.code === ERROR_CODES.VERSION_CONFLICT ? 409 : 400;
      return apiError(result.error!.code, result.error!.message, statusCode, {}, traceId);
    }

    return apiSuccess(result.data, { trace_id: traceId });
  } catch (error: any) {
    console.error("[POST /transition error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
