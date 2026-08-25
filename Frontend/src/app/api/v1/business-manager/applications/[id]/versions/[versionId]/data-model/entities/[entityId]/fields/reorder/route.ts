import { NextRequest } from "next/server";
import { FieldService } from "@/lib/services/datamodel/field.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string; entityId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId, entityId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  const res = await FieldService.reorder(id, versionId, entityId, body.orderedIds || [], actor, traceId);
  if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
  return apiSuccess({ reordered: true }, { trace_id: traceId });
}
