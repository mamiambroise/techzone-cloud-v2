import { NextRequest } from "next/server";
import { VersionService } from "@/lib/services/version.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; otherVersionId: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id, versionId, otherVersionId } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la comparaison de versions", 403, {}, traceId);
    }

    const result = await VersionService.compareVersions(id, versionId, otherVersionId);
    return apiSuccess(result, { trace_id: traceId });
  } catch (error: any) {
    console.error("[GET /compare error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
