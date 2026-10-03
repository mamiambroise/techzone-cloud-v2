import { IntegrationErrorCode as Code } from '../common/errors/integration-error-code';
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
    // Do not propagate untrusted provider messages, credentials or IAM statuses.
    const status = err.httpStatus;
    let mapped: [number, string, string];
    if (err.code === 'AUTH_ERROR' || status === 401) mapped = [502, Code.INTEGRATION_AUTH_FAILED, 'Authentification Dolibarr refusee. Verifiez la cle API.'];
    else if (status === 403) mapped = [502, Code.ERP_PERMISSION_DENIED, 'Dolibarr refuse cette operation. Verifiez les permissions ERP.'];
    else if (err.code === 'TIMEOUT' || status === 408 || status === 504) mapped = [504, Code.INTEGRATION_TIMEOUT, 'Le delai de reponse Dolibarr est depasse.'];
    else if (err.code === 'RATE_LIMIT' || status === 429) mapped = [429, Code.INTEGRATION_RATE_LIMITED, 'La limite de requetes Dolibarr est atteinte. Reessayez plus tard.'];
    else if (err.code === 'CONNECTION_ERROR' || status === 503) mapped = [503, Code.INTEGRATION_PROVIDER_UNAVAILABLE, 'Dolibarr est inaccessible.'];
    else if (status === 404) mapped = [404, Code.ERP_RESOURCE_NOT_FOUND, 'Ressource Dolibarr introuvable.'];
    else if (status === 409) mapped = [409, Code.ERP_CONFLICT, 'Conflit avec les donnees ERP.'];
    else if (status === 400 || status === 422) mapped = [422, Code.INTEGRATION_PAYLOAD_INVALID, 'Les donnees sont refusees par Dolibarr.'];
    else mapped = [502, Code.ERP_OPERATION_FAILED, 'Operation Dolibarr en echec.'];
    // httpStatus can be synthesized by transport errors; only request logs carry
    // the actual upstream HTTP response status.
    return new ErpError(mapped[2], mapped[0], mapped[1], undefined, traceId);
  }
}
