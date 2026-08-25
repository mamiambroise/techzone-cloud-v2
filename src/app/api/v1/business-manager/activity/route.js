import { AuditService } from "@/lib/services/audit.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";
export async function GET(request) {
  const traceId = generateTraceId();
  try {
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_AUDIT)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la consultation de l'activité", 403, {}, traceId);
    }
    const {
      searchParams
    } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const eventType = searchParams.get("eventType") || undefined;
    const result = await AuditService.getGlobalActivities({
      page,
      limit,
      eventType
    });
    const pages = Math.ceil(result.total / limit) || 1;
    return apiSuccess(result.items, {
      trace_id: traceId,
      pagination: {
        page,
        limit,
        total: result.total,
        pages
      }
    });
  } catch (error) {
    console.error("[GET /activity error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}