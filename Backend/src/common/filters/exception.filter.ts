import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const traceId = request.traceId || uuidv4();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const exResponse = exceptionResponse as {
          error?: string;
          message?: string | string[];
          details?: Record<string, unknown>;
        };

        errorCode = exResponse.error || exception.name;

        if (Array.isArray(exResponse.message)) {
          message = exResponse.message.join(', ');
        } else {
          message = exResponse.message || exception.message;
        }

        details = exResponse.details || {};
      } else {
        message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      this.logger.error(exception.stack);
    }

    this.logger.error(
      `[${traceId}] ${errorCode} - ${message}`,
    );

    response.status(statusCode).json({
      success: false,

      data: null,

      error: {
        code: errorCode,
        message,
        details,
      },

      meta: {
        trace_id: traceId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}