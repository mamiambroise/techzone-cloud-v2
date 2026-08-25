import { CloneService } from "@/lib/services/clone.service";
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
    if (!hasPermission(actor, PERMISSIONS.CLONE_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de cloner cette application", 403, {}, traceId);
    }
    const body = await request.json();
    const result = await CloneService.cloneApplication(id, body, actor, traceId);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400, {}, traceId);
    }
    return apiSuccess(result.data, {
      trace_id: traceId
    }, 201);
  } catch (error) {
    console.error("[POST /clone error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}