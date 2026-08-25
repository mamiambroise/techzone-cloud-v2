import { NextRequest } from "next/server";
import { SeedService } from "@/lib/services/seed.service";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  try {
    const res = await SeedService.seedIfEmpty();
    return apiSuccess({ seeded: res.seeded, count: res.count }, { trace_id: traceId });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Erreur de seeding", 500, {}, traceId);
  }
}
