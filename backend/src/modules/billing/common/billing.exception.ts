import { HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BillingErrorCode } from './billing-error-code';

/**
 * Chaque erreur critique est corrélable (RG-BILL-033) : un `traceId` est
 * généré par défaut et repris tel quel par le filtre global.
 */
export class BillingException extends HttpException {
  constructor(
    public readonly code: BillingErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
    public readonly traceId = randomUUID(),
  ) {
    super(
      {
        success: false,
        code,
        message: `${code}: ${message}`,
        traceId,
        statusCode: status,
        ...(details !== undefined ? { details } : {}),
      },
      status,
    );

    this.name = 'BillingException';
  }
}

export const billingError = {
  notFound(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.NOT_FOUND, details);
  },
  badRequest(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.BAD_REQUEST, details);
  },
  conflict(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.CONFLICT, details);
  },
  forbidden(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.FORBIDDEN, details);
  },
  unprocessable(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  },
  unavailable(code: BillingErrorCode, message: string, details?: unknown): BillingException {
    return new BillingException(code, message, HttpStatus.SERVICE_UNAVAILABLE, details);
  },
};