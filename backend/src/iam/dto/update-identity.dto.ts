import { IsOptional, IsString, IsNumber, IsEmail, IsEnum, IsObject } from 'class-validator';

export enum IdentityStatusDto {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateIdentityDto {
  @IsOptional()
  @IsEnum(IdentityStatusDto)
  status?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
