import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum CredentialStatusEnum {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  EXPIRED = 'EXPIRED',
  ROTATION_REQUIRED = 'ROTATION_REQUIRED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateCredentialDto {
  @IsOptional()
  @IsEnum(CredentialStatusEnum)
  status?: CredentialStatusEnum;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  metadataSafe?: Record<string, unknown>;
}
