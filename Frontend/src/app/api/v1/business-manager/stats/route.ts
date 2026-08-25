import { NextRequest } from "next/server";
import { ApplicationService } from "@/lib/services/application.service";
import { SeedService } from "@/lib/services/seed.service";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(request: NextRequest) {
  const traceId = generateTraceId();
  try {
    // Auto seed on first hit if empty
    await SeedService.seedIfEmpty();
    const stats = await ApplicationService.getDashboardStats();
    return apiSuccess(stats, { trace_id: traceId });
  } catch (error: any) {
    console.error("[API Stats Error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
