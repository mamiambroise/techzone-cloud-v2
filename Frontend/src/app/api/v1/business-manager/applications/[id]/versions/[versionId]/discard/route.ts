import { NextRequest } from "next/server";
import { VersionService } from "@/lib/services/version.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
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
    if (!hasPermission(actor, PERMISSIONS.CREATE_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de supprimer ce brouillon", 403, {}, traceId);
    }

    const result = await VersionService.discardDraftVersion(id, versionId, actor, traceId);
    if (!result.success) {
      return apiError(result.error!.code, result.error!.message, 400, {}, traceId);
    }

    return apiSuccess({ discarded: true }, { trace_id: traceId });
  } catch (error: any) {
    console.error("[POST /discard error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
