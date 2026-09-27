import { Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * TraceIdMiddleware — smallest appropriate traceId mechanism.
 *
 * - Accepts incoming X-Trace-Id if present and well-formed (non-empty string).
 * - Otherwise generates a server-side traceId.
 * - Attaches it to `request.traceId` so downstream code (guards, services,
 *   filters) can read it.
 * - Echoes it back on the response via X-Trace-Id header for client correlation.
 *
 * No sensitive data is logged here.
 */
@Injectable()
export class TraceIdMiddleware {
  private readonly logger = new Logger(TraceIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const incoming = (req.headers['x-trace-id'] as string | undefined)?.trim();
    const traceId = incoming && incoming.length > 0 ? incoming : this.generateTraceId();

    (req as any).traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);

    next();
  }

  private generateTraceId(): string {
    const rand = Math.random().toString(36).substring(2, 10);
    return `tr-${Date.now().toString(36)}-${rand}`;
  }
}