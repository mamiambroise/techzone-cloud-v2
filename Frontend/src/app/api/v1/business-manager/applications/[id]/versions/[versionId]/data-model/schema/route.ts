import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const schema = await SchemaService.buildSchema(id, versionId);
  return apiSuccess({ ...schema, schemaHash: SchemaService.fingerprint(schema) }, { trace_id: traceId });
}
