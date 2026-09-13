import { HttpException, HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-codes';

export interface ApiExceptionDetails {
  field?: string;
  value?: unknown;
  resource?: string;
  id?: string;
  expected?: string;
  [key: string]: unknown;
}

export interface ApiExceptionResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiExceptionDetails;
  };
  statusCode: number;
}

export class ApiException extends HttpException {
  constructor(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: ApiExceptionDetails,
  ) {
    const response: ApiExceptionResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      statusCode,
    };

    super(response, statusCode);
  }
}
