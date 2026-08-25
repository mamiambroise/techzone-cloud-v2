import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { getActorFromRequest } from "@/lib/services/auth.service";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const actor = getActorFromRequest(request);
  const result = await SchemaService.validate(id, versionId, actor.id, traceId);
  return apiSuccess(result, { trace_id: traceId });
}
