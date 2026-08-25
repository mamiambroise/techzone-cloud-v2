import { NextRequest } from "next/server";
import { ApplicationService } from "@/lib/services/application.service";
import { LifecycleService } from "@/lib/services/lifecycle.service";
import { ERROR_CODES } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();
  try {
    const { id } = await params;
    const app = await ApplicationService.getApplication(id);
    if (!app) {
      return apiError(ERROR_CODES.APPLICATION_NOT_FOUND, `Application introuvable`, 404, {}, traceId);
    }

    const allowedTransitions = LifecycleService.getAllowedTransitions(app.status);

    return apiSuccess(
      {
        currentStatus: app.status,
        allowedTransitions,
      },
      { trace_id: traceId }
    );
  } catch (error: any) {
    console.error("[GET /transitions error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
