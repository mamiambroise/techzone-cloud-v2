// ERP Error Contract v1
// Canonical structured error for the ERP Adapter Platform.
// Reuses existing IamError / DolibarrError field names where possible.

export interface ErpErrorPayload {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  traceId?: string;
  details?: unknown;
}

export class ErpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly traceId?: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'ERP_ERROR',
    details?: unknown,
    traceId?: string,
  ) {
    super(message);
    this.name = 'ErpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
  }

  toHttpBody(): ErpErrorPayload {
    const body: ErpErrorPayload = {
      success: false,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
    };
    if (this.traceId) body.traceId = this.traceId;
    if (this.details !== undefined && this.details !== null) {
      body.details = this.details;
    }
    return body;
  }

  static notConfigured(message = 'ERP non configure pour ce tenant', details?: unknown, traceId?: string): ErpError {
    return new ErpError(message, 503, 'ERP_INSTANCE_NOT_CONFIGURED', details, traceId);
  }

  static providerRequired(message = 'ERP provider requis', details?: unknown, traceId?: string): ErpError {
    return new ErpError(message, 400, 'ERP_PROVIDER_REQUIRED', details, traceId);
  }

  static tenantRequired(message = 'TENANT_REQUIRED: tenantId manquant dans le contexte', details?: unknown, traceId?: string): ErpError {
    return new ErpError(message, 400, 'TENANT_REQUIRED', details, traceId);
  }

  static providerUnsupported(provider: string, traceId?: string): ErpError {
    return new ErpError(
      `ERP provider "${provider}" non supporte`,
      400,
      'ERP_PROVIDER_UNSUPPORTED',
      { provider },
      traceId,
    );
  }

  static unavailable(message = 'ERP actuellement indisponible', details?: unknown, traceId?: string): ErpError {
    return new ErpError(message, 503, 'ERP_UNAVAILABLE', details, traceId);
  }

  static fromDolibarr(err: { code?: string; message?: string; httpStatus?: number; details?: unknown }, traceId?: string): ErpError {
    const code = String(err?.code || '').toUpperCase();
    const message = err?.message || 'Erreur ERP';
    const status = err?.httpStatus ?? 500;

    // Connection / timeout / unreachable → ERP_UNAVAILABLE
    if (
      code === 'CONNECTION_ERROR' ||
      code === 'TIMEOUT' ||
      code === 'ERP_ERROR' ||
      code === 'RATE_LIMIT' ||
      status === 502 ||
      status === 503 ||
      status === 504
    ) {
      return ErpError.unavailable(message, { erpCode: 'DOLIBARR', originalCode: code }, traceId);
    }
    if (code === 'AUTH_ERROR' || status === 401) {
      return new ErpError(message, 401, 'UNAUTHENTICATED', { erpCode: 'DOLIBARR', originalCode: code }, traceId);
    }
    if (code === 'NOT_FOUND' || status === 404) {
      return new ErpError(message, 404, 'NOT_FOUND', { erpCode: 'DOLIBARR', originalCode: code }, traceId);
    }
    if (code === 'BAD_REQUEST' || status === 400) {
      return new ErpError(message, 400, 'BAD_REQUEST', { erpCode: 'DOLIBARR', originalCode: code }, traceId);
    }
    if (status === 403 || status === 409) {
      return new ErpError(message, status, code || 'FORBIDDEN', { erpCode: 'DOLIBARR', originalCode: code }, traceId);
    }
    return new ErpError(message, status, code || 'ERP_ERROR', { erpCode: 'DOLIBARR', originalCode: code }, traceId);
  }
}