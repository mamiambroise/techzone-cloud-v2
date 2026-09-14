import { HttpException, HttpStatus } from '@nestjs/common';
import { DeploymentErrorCode } from './deployment-error-code.enum';

export class DeploymentException extends HttpException {
  constructor(
    code: DeploymentErrorCode,
    message: string,
    status: HttpStatus,
    details?: unknown,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
