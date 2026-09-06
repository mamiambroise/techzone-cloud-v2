import { HttpException, HttpStatus } from '@nestjs/common';

import { PlatformErrorCode } from './platform-error-code.enum';

export class PlatformException extends HttpException {
  constructor(
    code: PlatformErrorCode,
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
