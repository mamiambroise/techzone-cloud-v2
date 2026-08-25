import { NextRequest } from "next/server";
import { DATA_TYPES } from "@/lib/services/datamodel/registry";
import { apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(request: NextRequest) {
  const traceId = generateTraceId();
  return apiSuccess(DATA_TYPES, { trace_id: traceId });
}
