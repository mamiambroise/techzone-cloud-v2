import { VersionService } from "@/lib/services/version.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";
export async function GET(request, {
  params
}) {
  const traceId = generateTraceId();
  try {
    const {
      id
    } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la consultation des versions", 403, {}, traceId);
    }
    const versions = await VersionService.listVersions(id);
    return apiSuccess(versions, {
      trace_id: traceId
    });
  } catch (error) {
    console.error("[GET /versions error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
export async function POST(request, {
  params
}) {
  const traceId = generateTraceId();
  try {
    const {
      id
    } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.CREATE_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de créer une version", 403, {}, traceId);
    }
    const body = await request.json();
    const result = await VersionService.createVersion(id, body, actor, traceId);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400, {}, traceId);
    }
    return apiSuccess(result.data, {
      trace_id: traceId
    }, 201);
  } catch (error) {
    console.error("[POST /versions error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}