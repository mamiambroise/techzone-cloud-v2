import { NextRequest } from "next/server";
import { PublicationService } from "@/lib/services/publication.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_VERSION)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la consultation des publications", 403, {}, traceId);
    }

    const publications = await PublicationService.listPublications(id);
    return apiSuccess(publications, { trace_id: traceId });
  } catch (error: any) {
    console.error("[GET /publications error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
