import { NextRequest } from "next/server";
import { ApplicationService } from "@/lib/services/application.service";
import { SeedService } from "@/lib/services/seed.service";
import { getActorFromRequest, hasPermission } from "@/lib/services/auth.service";
import { ERROR_CODES, PERMISSIONS } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(request: NextRequest) {
  const traceId = generateTraceId();
  try {
    // Seed initial data if empty
    await SeedService.seedIfEmpty();

    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.READ_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Accès refusé pour la lecture des applications", 403, {}, traceId);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const environment = searchParams.get("environment") || undefined;
    const sort = (searchParams.get("sort") as any) || "updated_at";
    const order = (searchParams.get("order") as any) || "desc";
    const includeArchived = searchParams.get("includeArchived") === "true";

    const result = await ApplicationService.listApplications({
      page,
      limit,
      search,
      status,
      category,
      environment,
      sort,
      order,
      includeArchived,
    });

    return apiSuccess(result.items, {
      trace_id: traceId,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[GET /applications error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  try {
    const actor = getActorFromRequest(request);
    if (!hasPermission(actor, PERMISSIONS.CREATE_APP)) {
      return apiError(ERROR_CODES.PERMISSION_DENIED, "Vous n'avez pas la permission de créer une application", 403, {}, traceId);
    }

    const body = await request.json();
    const result = await ApplicationService.createApplication(body, actor, traceId);

    if (!result.success) {
      return apiError(result.error!.code, result.error!.message, 400, {}, traceId);
    }

    return apiSuccess(result.data, { trace_id: traceId }, 201);
  } catch (error: any) {
    console.error("[POST /applications error]:", error);
    return apiError("INTERNAL_ERROR", error.message || "Erreur interne", 500, {}, traceId);
  }
}
