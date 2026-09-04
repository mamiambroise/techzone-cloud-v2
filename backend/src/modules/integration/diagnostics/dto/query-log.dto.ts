import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  IntegrationLogDirectionEnum,
  IntegrationLogStatusEnum,
} from './create-log.dto';

export class QueryIntegrationLogsDto {
  @IsOptional()
  @IsString()
  traceId?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  connectorId?: string;

  @IsOptional()
  @IsString()
  operation?: string;

  @IsOptional()
  @IsEnum(IntegrationLogDirectionEnum)
  direction?: IntegrationLogDirectionEnum;

  @IsOptional()
  @IsEnum(IntegrationLogStatusEnum)
  status?: IntegrationLogStatusEnum;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
