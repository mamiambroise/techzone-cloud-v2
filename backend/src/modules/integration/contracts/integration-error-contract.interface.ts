import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';

export interface IntegrationErrorContract {
  readonly code: IntegrationErrorCode;
  readonly message: string;
  readonly statusCode: number;
  readonly traceId?: string;
  readonly details?: unknown;
  readonly timestamp: string;
}
