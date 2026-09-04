import { HttpException, HttpStatus } from '@nestjs/common';
import { IntegrationErrorCode } from './integration-error-code';

export class IntegrationException extends HttpException {
  constructor(
    public readonly code: IntegrationErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
    public readonly details?: unknown,
  ) {
    super(
      {
        code,
        message,
        statusCode: status,
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );

    this.name = 'IntegrationException';
  }
}
