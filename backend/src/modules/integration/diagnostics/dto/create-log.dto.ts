import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum IntegrationLogDirectionEnum {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum IntegrationLogStatusEnum {
  STARTED = 'STARTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
}

export class CreateIntegrationLogDto {
  @IsNotEmpty()
  @IsString()
  traceId!: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  connectorId?: string;

  @IsNotEmpty()
  @IsString()
  operation!: string;

  @IsNotEmpty()
  @IsEnum(IntegrationLogDirectionEnum)
  direction!: IntegrationLogDirectionEnum;

  @IsNotEmpty()
  @IsEnum(IntegrationLogStatusEnum)
  status!: IntegrationLogStatusEnum;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempt?: number;

  @IsOptional()
  details?: Record<string, unknown>;
}
