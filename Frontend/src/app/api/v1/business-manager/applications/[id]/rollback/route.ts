import { NextRequest } from "next/server";
import { PublicationService } from "@/lib/services/publication.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { Environment, ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
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
    if (!hasPermission(actor, PERMISSIONS.ROLLBACK_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission d'effectuer un rollback sur cette application", 403, {}, traceId);
    }

    const body = await request.json();
    const targetVersionId = body.targetVersionId;
    const environment: Environment = body.environment;

    if (!targetVersionId) {
      return apiError(ERROR_CODES.INVALID_REQUEST, "Le champ targetVersionId est obligatoire pour effectuer un rollback", 400, {}, traceId);
    }

    const result = await PublicationService.rollbackToVersion(id, targetVersionId, environment, actor, traceId);

    if (!result.success) {
      return apiError(result.error!.code, result.error!.message, 400, result.error!.details, traceId);
    }

    return apiSuccess(result.data, { trace_id: traceId });
  } catch (error: any) {
    console.error("[POST /rollback error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
