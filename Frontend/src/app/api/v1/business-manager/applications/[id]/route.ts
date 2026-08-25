import { NextRequest } from "next/server";
import { ApplicationService } from "@/lib/services/application.service";
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
    if (!hasPermission(actor, PERMISSIONS.READ_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la lecture de l'application", 403, {}, traceId);
    }

    const app = await ApplicationService.getApplication(id);
    if (!app) {
      return apiError(ERROR_CODES.APPLICATION_NOT_FOUND, `Application avec l'ID "${id}" introuvable`, 404, {}, traceId);
    }

    return apiSuccess(app, { trace_id: traceId });
  } catch (error: any) {
    console.error("[GET /applications/:id error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id } = await params;
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de modifier cette application", 403, {}, traceId);
    }

    const body = await request.json();
    const result = await ApplicationService.updateApplication(id, body, actor, traceId);

    if (!result.success) {
      const status = result.error!.code === ERROR_CODES.VERSION_CONFLICT ? 409 : 400;
      return apiError(result.error!.code, result.error!.message, status, {}, traceId);
    }

    return apiSuccess(result.data, { trace_id: traceId });
  } catch (error: any) {
    console.error("[PATCH /applications/:id error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
