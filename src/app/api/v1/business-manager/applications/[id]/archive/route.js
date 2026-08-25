import { ApplicationService } from "@/lib/services/application.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";
export async function POST(request, {
  params
}) {
  const traceId = generateTraceId();
  try {
    const {
      id
    } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.ARCHIVE_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission d'archiver cette application", 403, {}, traceId);
    }
    const result = await ApplicationService.archiveApplication(id, actor, traceId);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400, {}, traceId);
    }
    return apiSuccess(result.data, {
      trace_id: traceId
    });
  } catch (error) {
    console.error("[POST /applications/:id/archive error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}