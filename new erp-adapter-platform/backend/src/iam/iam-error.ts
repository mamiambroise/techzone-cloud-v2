export interface IamErrorPayload {
  success: false;
  statusCode: number;
  message: string;
  code: string;
  details?: unknown;
}

export class IamError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  toHttpBody(): IamErrorPayload {
    const body: IamErrorPayload = {
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
    };
    if (this.details !== null && this.details !== undefined) {
      body.details = this.details;
    }
    return body;
  }
}