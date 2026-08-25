import { NextRequest } from "next/server";
import { SchemaService } from "@/lib/services/datamodel/schema.service";
import { loadVersion } from "@/lib/services/datamodel/common";
import { applications } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ERROR_CODES } from "@/lib/types/domain";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { generateTraceId } from "@/lib/utils/trace";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const traceId = generateTraceId();
  const { id, versionId } = await params;
  const url = new URL(request.url);
  let baseVersionId = url.searchParams.get("base");

  if (!baseVersionId) {
    // Default base = published version of the application (fallback: current version)
    const version = await loadVersion(id, versionId);
    if (!version) return apiError(ERROR_CODES.DATA_MODEL_NOT_FOUND, "Version introuvable", 404, {}, traceId);
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    baseVersionId = app?.publishedVersionId && app.publishedVersionId !== versionId ? app.publishedVersionId : versionId;
  }

  const diff = await SchemaService.diff(baseVersionId, versionId);
  return apiSuccess(diff, { trace_id: traceId });
}
