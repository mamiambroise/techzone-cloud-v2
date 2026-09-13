import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiExceptionResponse } from '../errors/api-exception';
import { ErrorCode } from '../errors/error-codes';
import { mapPrismaError } from '../errors/prisma-error.mapper';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    const prismaError = mapPrismaError(exception);

    if (prismaError) {
      return response.status(prismaError.statusCode).json({
        success: false,
        error: {
          code: prismaError.code,
          message: prismaError.message,
          ...(prismaError.details && {
            details: prismaError.details,
          }),
        },
        statusCode: prismaError.statusCode,
        timestamp,
        path,
      });
    }

    /*
     * 1. ApiException / HttpException
     */
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      /*
       * Notre ApiException possède déjà le format standard.
       */
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'success' in exceptionResponse &&
        'error' in exceptionResponse
      ) {
        const apiResponse = exceptionResponse as ApiExceptionResponse;

        return response.status(statusCode).json({
          ...apiResponse,
          timestamp,
          path,
        });
      }

      /*
       * Erreurs HTTP NestJS classiques.
       */
      let message = 'Une erreur est survenue.';
      let code = ErrorCode.INTERNAL_ERROR;
      let details: Record<string, unknown> | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const exceptionData = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(exceptionData.message)) {
          code = ErrorCode.VALIDATION_ERROR;
          message = 'Les données fournies sont invalides.';
          details = {
            messages: exceptionData.message,
          };
        } else if (typeof exceptionData.message === 'string') {
          message = exceptionData.message;
        }
      }

      /*
       * Mapping des statuts HTTP vers nos codes génériques.
       */
      if (statusCode === HttpStatus.BAD_REQUEST) {
        code =
          code === ErrorCode.INTERNAL_ERROR ? ErrorCode.INVALID_INPUT : code;
      } else if (statusCode === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.UNAUTHORIZED;
      } else if (statusCode === HttpStatus.FORBIDDEN) {
        code = ErrorCode.FORBIDDEN;
      } else if (statusCode === HttpStatus.NOT_FOUND) {
        code = ErrorCode.RESOURCE_NOT_FOUND;
      } else if (statusCode === HttpStatus.CONFLICT) {
        code = ErrorCode.INVALID_STATE;
      }

      return response.status(statusCode).json({
        success: false,
        error: {
          code,
          message,
          ...(details && { details }),
        },
        statusCode,
        timestamp,
        path,
      });
    }

    /*
     * 2. Erreur inconnue / erreur serveur
     */
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Une erreur interne est survenue sur le serveur.',
      },
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
    });
  }
}
