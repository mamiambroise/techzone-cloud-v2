import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  CredentialStatus,
  CredentialType,
} from '../../../../generated/prisma/enums';

export class CreateCredentialDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  code: string;

  @IsEnum(CredentialType)
  type: CredentialType;

  @IsString()
  @MaxLength(100)
  provider: string;

  @IsOptional()
  @IsObject()
  metadataSafe?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secretValue?: string;
}

export class UpdateCredentialDto {
  @IsOptional()
  @IsEnum(CredentialStatus)
  status?: CredentialStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secretValue?: string;

  @IsOptional()
  @IsObject()
  metadataSafe?: Record<string, unknown>;

  @IsOptional()
  expiresAt?: Date;
}

export class RotateCredentialDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  secretValue?: string;

  @IsOptional()
  expiresAt?: Date;
}

export interface CredentialSafeView {
  id: string;
  code: string;
  type: CredentialType;
  provider: string;
  status: CredentialStatus;
  lastRotatedAt: Date | null;
  expiresAt: Date | null;
  metadataSafe: Record<string, unknown> | null;
  maskedSecret: string;
  createdAt: Date;
  updatedAt: Date;
}
