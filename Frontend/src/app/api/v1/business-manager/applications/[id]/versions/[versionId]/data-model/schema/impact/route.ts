import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { versionId } = await params;
  const body = await request.json();
  const report = await SchemaService.impactAnalysis(versionId, body);
  return apiSuccess(report, { trace_id: traceId });
}
