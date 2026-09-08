import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { IamError } from '../iam/iam-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let code: string | undefined;
    let details: unknown;

    if (exception instanceof IamError) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message || message;
      code = (exResponse as any).code;
    } else if (exception instanceof Error) {
      this.logger.error(`Exception non geree: ${exception.message}`, exception.stack);
    }

    const body: Record<string, unknown> = {
      success: status < 400,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };
    if (code) body.code = code;
    if (details !== undefined) body.details = details;

    response.status(status).json(body);
  }
}