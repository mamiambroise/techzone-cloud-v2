import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { IamError } from '../iam/iam-error';
import { DolibarrError } from '../erp-adapter/dolibarr/dolibarr.error';
import { ErpError } from '../erp-adapter/erp-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId =
      (request as any)?.traceId ||
      (request as any)?.headers?.['x-trace-id'] ||
      Math.random().toString(36).substring(2, 10);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let code: string | undefined;
    let details: unknown;

    if (exception instanceof ErpError) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof IamError) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof DolibarrError) {
      // Canonicalize Dolibarr errors into the ERP error contract.
      // Connection / timeout / unreachable → ERP_UNAVAILABLE (503),
      // never a generic Internal Server Error.
      const canonical = ErpError.fromDolibarr(exception, traceId);
      status = canonical.statusCode;
      message = canonical.message;
      code = canonical.code;
      details = canonical.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
      code = (exResponse as any)?.code;
      details = (exResponse as any)?.details;
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