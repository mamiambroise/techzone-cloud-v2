import { NextRequest } from "next/server";
import { RelationService } from "@/lib/services/datamodel/relation.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { versionId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.READ_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé", 403, {}, traceId);
  const relations = await RelationService.list(versionId);
  return apiSuccess(relations, { trace_id: traceId });
}

export async function POST(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  const res = await RelationService.create(id, versionId, body, actor, traceId);
  if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
  return apiSuccess(res.data, { trace_id: traceId }, 201);
}
