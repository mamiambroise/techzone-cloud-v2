import { NextRequest } from "next/server";
import { ValidationServiceDM } from "@/lib/services/datamodel/extras.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.READ_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé", 403, {}, traceId);
  const fieldId = new URL(request.url).searchParams.get("fieldId") || undefined;
  const rows = await ValidationServiceDM.list(fieldId);
  return apiSuccess(rows, { trace_id: traceId });
}

export async function POST(request: NextRequest, { params }: Params) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const actor = getActorFromRequest(request);
  if (!hasPermission(actor, PERMISSIONS.UPDATE_APP)) return apiError(ERROR_CODES.PERMISSION_DENIED, "Permission refusée", 403, {}, traceId);
  const body = await request.json();
  if (body.action === "remove") {
    const res = await ValidationServiceDM.remove(id, versionId, body.id, actor, traceId);
    if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
    return apiSuccess({ removed: true }, { trace_id: traceId });
  }
  const res = await ValidationServiceDM.create(id, versionId, body, actor, traceId);
  if (!res.success) return apiError(res.error!.code, res.error!.message, 400, {}, traceId);
  return apiSuccess(res.data, { trace_id: traceId }, 201);
}
