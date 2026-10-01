import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

import { DolibarrError } from '../../erp-adapter/dolibarr/dolibarr.error';
import { ErpError } from '../../erp-adapter/erp-error';

interface StructuredError {
  statusCode?: number;
  message?: string;
  code?: string;
  details?: unknown;
}

/** Codes réseau axios : connectivité/timeout ⇒ ERP indisponible (jamais un 500 opaque). */
const AXIOS_CONNECTIVITY_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ECONNABORTED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
  'ERR_NETWORK',
]);

function isAxiosConnectivityError(exception: unknown): exception is Error & { code?: string } {
  return (
    exception instanceof Error &&
    'isAxiosError' in exception &&
    AXIOS_CONNECTIVITY_CODES.has(String((exception as { code?: string }).code ?? ''))
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId =
      request?.traceId ||
      request?.headers?.['x-trace-id'] ||
      Math.random().toString(36).substring(2, 10);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let code: string | undefined;
    let details: unknown;
    let connector: string | undefined;

    const err = exception as StructuredError;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any)?.message || message;
      code = (exResponse as any)?.code ?? (exResponse as any)?.error?.code;
      details = (exResponse as any)?.details ?? (exResponse as any)?.error?.details;
    } else if (exception instanceof DolibarrError) {
      // Cause racine historique : DolibarrError porte httpStatus/code, ni statusCode
      // ni dolibarr_code — aucune branche ne matchait → 500 « Erreur interne ».
      // Traduction canonique vers le contrat ERP structuré (ErpError v1).
      const erpError = ErpError.fromDolibarr(exception, traceId);
      status = erpError.statusCode;
      message = erpError.message;
      code = erpError.code;
      connector = 'DOLIBARR';
      details = { ...(erpError.details as Record<string, unknown> | undefined), httpStatus: exception.httpStatus };
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
      connector = 'DOLIBARR';
    } else if (isAxiosConnectivityError(exception)) {
      const erpError = ErpError.unavailable(
        `ERP injoignable : ${exception.message}`,
        { originalCode: exception.code },
        traceId,
      );
      status = erpError.statusCode;
      message = erpError.message;
      code = erpError.code;
      details = erpError.details;
    } else if (exception instanceof Error) {
      this.logger.error(`Exception non geree: ${exception.message}`, exception.stack);
    }

    // ErpError.fromDolibarr lancé directement par la couche service : connector
    // dérivé des details (erpCode) plutôt que d'une branche dédiée.
    if (!connector && details && typeof details === 'object' && (details as { erpCode?: string }).erpCode) {
      connector = (details as { erpCode?: string }).erpCode;
    }

    const body: Record<string, unknown> = {
      success: status < 400,
      statusCode: status,
      message,
      traceId,
      timestamp: new Date().toISOString(),
    };
    if (code) body.code = code;
    if (connector) body.connector = connector;
    if (details !== undefined && details !== null) body.details = details;

    response.status(status).json(body);
  }
}
