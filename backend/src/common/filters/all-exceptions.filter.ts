import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

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

    const traceId =
      (host.switchToHttp().getRequest() as any)?.traceId ||
      (host.switchToHttp().getRequest() as any)?.headers?.['x-trace-id'] ||
      Math.random().toString(36).substring(2, 10);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let code: string | undefined;
    let details: unknown;

    const err = exception as StructuredError;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
      code = (exResponse as any)?.code;
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
      this.logger.error(`Exception non geree: ${exception.message}`, exception.stack);
    }

    const body: Record<string, unknown> = {
      success: status < 400,
      statusCode: status,
      message,
      traceId,
      timestamp: new Date().toISOString(),
    };
    if (code) body.code = code;
    if (details !== undefined && details !== null) body.details = details;

    response.status(status).json(body);
  }
}
