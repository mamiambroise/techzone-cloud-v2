import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { getActorFromRequest } from "@/lib/services/auth.service";
import { dmAudit } from "@/lib/services/datamodel/common";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const actor = getActorFromRequest(request);
  const exported = await SchemaService.exportSchema(id, versionId);
  await dmAudit({
    applicationId: id,
    applicationVersionId: versionId,
    actorId: actor.id,
    eventType: "data.schema.changed",
    action: "SCHEMA_EXPORT",
    targetType: "SCHEMA",
    targetId: versionId,
    traceId,
  });
  return apiSuccess(exported, { trace_id: traceId });
}
