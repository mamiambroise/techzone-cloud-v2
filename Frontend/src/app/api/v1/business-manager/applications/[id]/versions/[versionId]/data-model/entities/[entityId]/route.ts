import { NextRequest } from "next/server";
import { EntityService } from "@/lib/services/datamodel/entity.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

type Params = { params: Promise<{ id: string; versionId: string; entityId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { versionId, entityId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.READ_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé", 403, {}, traceId);
  const entity = await EntityService.get(versionId, entityId);
  if (!entity) return apiError(ERROR_CODES.ENTITY_NOT_FOUND, "Entité introuvable", 404, {}, traceId);
  return apiSuccess(entity, { trace_id: traceId });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { id, versionId, entityId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  const res = await EntityService.update(id, versionId, entityId, body, actor, traceId);
  if (!res.success) {
    const status = res.error!.code === ERROR_CODES.VERSION_CONFLICT ? 409 : 400;
    return apiError(res.error!.code, res.error!.message, status, {}, traceId);
  }
  return apiSuccess(res.data, { trace_id: traceId });
}
