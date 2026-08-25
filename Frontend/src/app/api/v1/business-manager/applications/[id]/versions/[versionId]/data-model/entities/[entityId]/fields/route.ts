import { NextRequest } from "next/server";
import { FieldService } from "@/lib/services/datamodel/field.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

type Params = { params: Promise<{ id: string; versionId: string; entityId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { entityId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.READ_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé", 403, {}, traceId);
  const fields = await FieldService.list(entityId);
  return apiSuccess(fields, { trace_id: traceId });
}

export async function POST(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { id, versionId, entityId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  const res = await FieldService.create(id, versionId, entityId, body, actor, traceId);
  if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
  return apiSuccess(res.data, { trace_id: traceId }, 201);
}
