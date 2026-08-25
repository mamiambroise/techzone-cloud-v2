import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { versionId } = await params;
  const url = new URL(request.url);
  const objectType = url.searchParams.get("objectType");
  const objectId = url.searchParams.get("objectId");

  if (objectType && objectId) {
    const deps = await SchemaService.dependenciesOf(versionId, objectType, objectId);
    return apiSuccess(deps, { trace_id: traceId });
  }

  const graph = await SchemaService.dependencies(versionId);
  return apiSuccess(graph, { trace_id: traceId });
}
