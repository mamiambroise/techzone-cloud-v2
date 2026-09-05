import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IntegrationLogDirection, IntegrationLogStatus } from '../../../../generated/prisma/enums';

export class SearchLogsDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  traceId?: string;

  @IsOptional()
  @IsString()
  connectorId?: string;

  @IsOptional()
  @IsEnum(IntegrationLogDirection)
  direction?: IntegrationLogDirection;

  @IsOptional()
  @IsEnum(IntegrationLogStatus)
  status?: IntegrationLogStatus;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  operation?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export interface DiagnosisCategory {
  code: string;
  label: string;
  count: number;
  description: string;
}

export interface TimelineEntry {
  traceId: string;
  tenantId: string | null;
  connectorId: string | null;
  operation: string;
  direction: string;
  startedAt: Date;
  finishedAt: Date | null;
  duration: number | null;
  status: string;
  errorCode: string | null;
  attempt: number;
}

export interface IntegrationMetrics {
  requestCount: number;
  successRate: number;
  failureRate: number;
  averageLatency: number;
  timeoutCount: number;
  retryCount: number;
  rateLimitEvents: number;
  webhookDeliveryFailures: number;
  syncFailures: number;
  diagnosisBreakdown: DiagnosisCategory[];
}

export interface TimelineResult {
  traceId: string;
  entries: TimelineEntry[];
  summary: {
    totalSteps: number;
    duration: number | null;
    status: 'SUCCEEDED' | 'FAILED' | 'PARTIAL' | 'UNKNOWN';
    errorCodes: string[];
  };
}

const DIAGNOSIS_CATEGORIES: Record<string, { label: string; description: string }> = {
  INTEGRATION_AUTH_FAILED: {
    label: 'Authentication Failure',
    description: 'The integration provider rejected authentication credentials',
  },
  INTEGRATION_PROVIDER_UNAVAILABLE: {
    label: 'Provider Unavailable',
    description: 'The external system or integration provider is not reachable',
  },
  INTEGRATION_TIMEOUT: {
    label: 'Timeout',
    description: 'The integration operation exceeded the configured timeout',
  },
  INTEGRATION_RATE_LIMITED: {
    label: 'Rate Limit',
    description: 'The integration provider returned a rate limit response',
  },
  INTEGRATION_PAYLOAD_INVALID: {
    label: 'Invalid Payload',
    description: 'The request payload did not conform to the expected contract',
  },
  INTEGRATION_CONTRACT_UNSUPPORTED: {
    label: 'Contract Mismatch',
    description: 'The integration provider does not support the requested contract',
  },
  WEBHOOK_SIGNATURE_FAILED: {
    label: 'Webhook Signature Failure',
    description: 'The inbound webhook signature could not be verified',
  },
  SYNCHRONIZATION_CONFLICT: {
    label: 'Synchronization Conflict',
    description: 'A data conflict was encountered during synchronization',
  },
  INTERNAL_INTEGRATION_ERROR: {
    label: 'Internal Integration Error',
    description: 'An unexpected internal error occurred during integration',
  },
  INTEGRATION_INVALID_STATE: {
    label: 'Invalid State',
    description: 'The integration entity is in an invalid state for the requested operation',
  },
};

export function getDiagnosisCategories(): typeof DIAGNOSIS_CATEGORIES {
  return DIAGNOSIS_CATEGORIES;
}
