import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { DolibarrError } from '../../erp-adapter/dolibarr/dolibarr.error';
import { ErpError } from '../../erp-adapter/erp-error';

interface StructuredError {
  statusCode?: number;
  message?: string;
  code?: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest();
    const incomingTrace = request?.traceId || request?.headers?.['x-trace-id'];
    const traceId = typeof incomingTrace === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(incomingTrace) ? incomingTrace : randomUUID();
    const isErp = exception instanceof DolibarrError || exception instanceof ErpError || /^\/api\/erp(?:\/|-registry)/.test(request?.url || '');
    if (exception instanceof DolibarrError) exception = ErpError.fromDolibarr(exception, traceId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let code: string | undefined = isErp ? 'INTEGRATION_INTERNAL_ERROR' : 'INTERNAL_ERROR';
    let details: unknown;

    const err = exception as StructuredError;

    const dbCode = (exception as any)?.code || (exception as any)?.cause?.code;
    if (['P1001', 'P1002', 'P1017', 'ECONNREFUSED', 'ETIMEDOUT', '57P01'].includes(dbCode)) {
      status = 503;
      code = 'DATABASE_UNAVAILABLE';
      message = 'La base de données est indisponible.';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
      code = (exResponse as any)?.code || (status === 403 ? 'FORBIDDEN' : status === 401 ? 'UNAUTHENTICATED' : status === 400 ? 'VALIDATION_ERROR' : code);
      details = (exResponse as any)?.details;
    } else if (exception && typeof exception === 'object' && 'statusCode' in exception && 'code' in exception) {
      status = err.statusCode!;
      message = err.message || message;
      code = err.code;
      details = err.details;
    } else if (exception && typeof exception === 'object' && 'dolibarr_code' in exception) {
      const dolibarrErr = exception as StructuredError & { dolibarr_code: string; message: string };
      status = dolibarrErr.statusCode || 502;
      message = dolibarrErr.message || 'ERP adapter error';
      code = dolibarrErr.code || dolibarrErr.dolibarr_code || 'ERP_ERROR';
      details = { ...dolibarrErr, traceId };
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled ${exception.name} traceId=${traceId}`, exception.stack?.split('\n').slice(1).join('\n'));
    }

    const body: Record<string, unknown> = {
      success: status < 400,
      statusCode: status,
      message,
      traceId,
      timestamp: new Date().toISOString(),
      ...(isErp ? { connector: 'dolibarr' } : {}),
    };
    if (code) body.code = code;
    if (details !== undefined && details !== null) body.details = details;

    if (isErp) this.logger.warn(`ERP request failed code=${code} status=${status} traceId=${traceId}`);
    response.setHeader('X-Trace-Id', traceId);
    response.status(status).json(body);
  }
}
