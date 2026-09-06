import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ErpAdapterException, ErpErrorCode } from '../erp-adapter/interfaces/erp-adapter-contract-extensions';

// Associe chaque code d'erreur métier ERP à un statut HTTP approprié.
const STATUS_BY_ERP_CODE: Record<ErpErrorCode, number> = {
  ERP_PROVIDER_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
  ERP_AUTHENTICATION_FAILED: HttpStatus.UNAUTHORIZED,
  ERP_RESOURCE_NOT_FOUND: HttpStatus.NOT_FOUND,
  ERP_CAPABILITY_UNAVAILABLE: HttpStatus.NOT_IMPLEMENTED,
  ERP_MAPPING_INVALID: HttpStatus.UNPROCESSABLE_ENTITY,
  ERP_FIELD_MISSING: HttpStatus.BAD_REQUEST,
  ERP_TYPE_MISMATCH: HttpStatus.BAD_REQUEST,
  ERP_TIMEOUT: HttpStatus.GATEWAY_TIMEOUT,
  ERP_RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  ERP_CONTRACT_VERSION_UNSUPPORTED: HttpStatus.BAD_REQUEST,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Cas 1 : erreur standardisée du contrat ERP Adapter (CDC-00 / CDC-05)
    if (exception instanceof ErpAdapterException) {
      const status = STATUS_BY_ERP_CODE[exception.contract.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      this.logger.warn(`[${exception.contract.code}] ${exception.contract.message} (traceId=${exception.contract.traceId})`);
      response.status(status).json(exception.contract);
      return;
    }

    // Cas 2 : comportement existant, inchangé, pour tout le reste
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
    } else if (exception instanceof Error) {
      this.logger.error(`Exception non geree: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}