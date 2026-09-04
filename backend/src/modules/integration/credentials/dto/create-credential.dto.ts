import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum CredentialTypeEnum {
  API_KEY = 'API_KEY',
  BASIC_AUTH = 'BASIC_AUTH',
  BEARER_TOKEN = 'BEARER_TOKEN',
  OAUTH_CLIENT = 'OAUTH_CLIENT',
  CERTIFICATE_REFERENCE = 'CERTIFICATE_REFERENCE',
  CUSTOM_SECRET_REFERENCE = 'CUSTOM_SECRET_REFERENCE',
}

export class CreateCredentialDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'code must be lowercase alphanumeric with hyphens',
  })
  code!: string;

  @IsNotEmpty()
  @IsEnum(CredentialTypeEnum)
  type!: CredentialTypeEnum;

  @IsNotEmpty()
  @IsString()
  provider!: string;

  @IsNotEmpty()
  @IsString()
  secretValue!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  metadataSafe?: Record<string, unknown>;
}
