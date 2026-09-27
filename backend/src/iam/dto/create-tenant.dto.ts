import { IsEnum, IsOptional, IsString, IsObject } from 'class-validator';

export enum TenantStatusDto {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateTenantDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TenantStatusDto)
  status: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
