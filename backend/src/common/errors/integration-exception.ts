import { HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IntegrationErrorCode } from './integration-error-code';

export class IntegrationException extends HttpException {
  constructor(
    public readonly code: IntegrationErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_GATEWAY,
    public readonly details?: unknown,
    public readonly traceId = randomUUID(),
  ) {
    super(
      {
        code,
        message: `${code}: ${message}`,
        traceId,
        statusCode: status,
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );

    this.name = 'IntegrationException';
  }
}
