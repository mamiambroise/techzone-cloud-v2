import { HttpException } from '@nestjs/common';

export class IamError extends HttpException {
  readonly code: string;

  constructor(message: string, status: number, code?: string) {
    super(message, status);
    this.code = code || 'IAM_ERROR';
  }
}

export function isIamError(err: unknown): err is IamError {
  return err instanceof IamError;
}