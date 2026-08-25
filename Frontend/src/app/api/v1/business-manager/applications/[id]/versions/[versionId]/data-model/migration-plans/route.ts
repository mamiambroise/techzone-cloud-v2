import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
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

  const body = await request.json().catch(() => ({}));
  const sourceVersionId = body.sourceVersionId;
  if (!sourceVersionId) return apiError(ERROR_CODES.MIGRATION_PLAN_INVALID, "sourceVersionId requis", 400, {}, traceId);

  const plan = await SchemaService.createMigrationPlan(id, sourceVersionId, versionId, actor, traceId);
  return apiSuccess(plan, { trace_id: traceId }, 201);
}
