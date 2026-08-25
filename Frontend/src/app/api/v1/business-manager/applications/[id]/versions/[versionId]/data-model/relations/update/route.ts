import { NextRequest } from "next/server";
import { RelationService } from "@/lib/services/datamodel/relation.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  const { relationId, action, ...input } = body;

  if (action === "remove") {
    const res = await RelationService.remove(id, versionId, relationId, actor, traceId);
    if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
    return apiSuccess({ removed: true }, { trace_id: traceId });
  }

  const res = await RelationService.update(id, versionId, relationId, input, actor, traceId);
  if (!res.success) {
    const status = res.error!.code === ERROR_CODES.VERSION_CONFLICT ? 409 : 400;
    return apiError(res.error!.code, res.error!.message, status, {}, traceId);
  }
  return apiSuccess(res.data, { trace_id: traceId });
}
