import { NextRequest } from "next/server";
import { VersionService } from "@/lib/services/version.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id, versionId } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la consultation de cette version", 403, {}, traceId);
    }

    const version = await VersionService.getVersion(id, versionId);
    if (!version) {
      return apiError(ERROR_CODES.VERSION_NOT_FOUND, `Version avec l'ID "${versionId}" introuvable`, 404, {}, traceId);
    }

    return apiSuccess(version, { trace_id: traceId });
  } catch (error: any) {
    console.error("[GET /versions/:versionId error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
