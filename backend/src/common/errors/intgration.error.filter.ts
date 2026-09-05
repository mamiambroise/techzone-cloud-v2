import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { IntegrationException } from './integration-exception';

@Catch()
export class IntegrationErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(IntegrationErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof IntegrationException) {
      const status = exception.getStatus();

      response.status(status).json({
        code: exception.code,
        message: exception.message,
        traceId: exception.traceId,
        statusCode: status,
        ...(exception.details !== undefined ? { details: exception.details } : {}),
      });

      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as Record<string, unknown>;

      if (typeof res.code === 'string' && typeof res.message === 'string') {
        response.status(status).json({
          code: res.code,
          message: res.message,
          traceId: res.traceId ?? undefined,
          statusCode: status,
          ...(res.details !== undefined ? { details: res.details } : {}),
        });
      } else {
        response.status(status).json({
          code: 'INTEGRATION_CONTRACT_UNSUPPORTED',
          message: typeof res === 'string' ? res : res.message ?? 'Bad Request',
          statusCode: status,
        });
      }

      return;
    }

    this.logger.error(
      `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
    );

    response.status(500).json({
      code: 'INTERNAL_INTEGRATION_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  }
}