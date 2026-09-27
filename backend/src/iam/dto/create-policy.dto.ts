import { IsEnum, IsInt, IsOptional, IsString, IsNumber, IsObject, IsBoolean } from 'class-validator';

export enum PolicyStatusDto {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUPERSEDED = 'SUPERSEDED',
  ARCHIVED = 'ARCHIVED',
}

export enum PolicyEffectDto {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  STEP_UP = 'STEP_UP',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
}

export class CreatePolicyDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PolicyStatusDto)
  status: string;

  @IsEnum(PolicyEffectDto)
  effect: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  subjectType?: string;

  @IsOptional()
  @IsString()
  subjectRef?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
