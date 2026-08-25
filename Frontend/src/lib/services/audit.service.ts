import { db } from "@/db";
import { activityEvents, applications } from "@/db/schema";
import { ActivityEventModel } from "../types/domain";
import { desc, eq, and, sql } from "drizzle-orm";
import { generateTraceId } from "../utils/trace";

export interface LogActivityParams {
  applicationId?: string | null;
  actorId: string;
  eventType: string;
  action: string;
  targetType: "APPLICATION" | "APPLICATION_VERSION" | "PUBLICATION";
  targetId: string;
  result?: "SUCCESS" | "FAILED" | "WARNING";
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  traceId?: string;
}

export class AuditService {
  static async log(params: LogActivityParams): Promise<void> {
    try {
      await db.insert(activityEvents).values({
        applicationId: params.applicationId ?? null,
        actorId: params.actorId,
        eventType: params.eventType,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        result: params.result || "SUCCESS",
        before: params.before ?? null,
        after: params.after ?? null,
        metadata: params.metadata ?? {},
        traceId: params.traceId || generateTraceId(),
      });
    } catch (error) {
      console.error("[AuditService] Failed to record audit log:", error);
    }
  }

  static async getApplicationActivities(
    applicationId: string,
    options: { page?: number; limit?: number; eventType?: string } = {}
  ): Promise<{ items: ActivityEventModel[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [eq(activityEvents.applicationId, applicationId)];
    if (options.eventType) {
      conditions.push(eq(activityEvents.eventType, options.eventType));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityEvents)
      .where(whereClause);

    const rows = await db
      .select()
      .from(activityEvents)
      .where(whereClause)
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const items: ActivityEventModel[] = rows.map((r) => ({
      id: r.id,
      applicationId: r.applicationId,
      actorId: r.actorId,
      eventType: r.eventType,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      result: r.result as any,
      before: r.before as any,
      after: r.after as any,
      metadata: r.metadata as any,
      traceId: r.traceId,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      items,
      total: countResult?.count || 0,
    };
  }

  static async getGlobalActivities(
    options: { page?: number; limit?: number; eventType?: string } = {}
  ): Promise<{ items: ActivityEventModel[]; total: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (options.eventType) {
      conditions.push(eq(activityEvents.eventType, options.eventType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityEvents)
      .where(whereClause);

    const rows = await db
      .select({
        event: activityEvents,
        appName: applications.name,
        appCode: applications.code,
      })
      .from(activityEvents)
      .leftJoin(applications, eq(activityEvents.applicationId, applications.id))
      .where(whereClause)
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const items: ActivityEventModel[] = rows.map((r) => ({
      id: r.event.id,
      applicationId: r.event.applicationId,
      actorId: r.event.actorId,
      eventType: r.event.eventType,
      action: r.event.action,
      targetType: r.event.targetType,
      targetId: r.event.targetId,
      result: r.event.result as any,
      before: r.event.before as any,
      after: r.event.after as any,
      metadata: r.event.metadata as any,
      traceId: r.event.traceId,
      createdAt: r.event.createdAt.toISOString(),
      applicationName: r.appName || undefined,
      applicationCode: r.appCode || undefined,
    }));

    return {
      items,
      total: countResult?.count || 0,
    };
  }
}
