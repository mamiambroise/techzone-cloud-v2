import { NextRequest } from "next/server";
import { PublicationService } from "@/lib/services/publication.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { Environment, ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
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
    if (!hasPermission(actor, PERMISSIONS.PUBLISH_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de publier cette version", 403, {}, traceId);
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body allowed
    }

    const environment: Environment = body.environment;
    const result = await PublicationService.publishVersion(id, versionId, environment, actor, traceId);

    if (!result.success) {
      return apiError(result.error!.code, result.error!.message, 400, result.error!.details, traceId);
    }

    return apiSuccess(result.data, { trace_id: traceId });
  } catch (error: any) {
    console.error("[POST /publish error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
