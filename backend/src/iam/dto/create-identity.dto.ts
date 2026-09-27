import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum IdentityTypeDto {
  HUMAN = 'HUMAN',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT',
  APPLICATION = 'APPLICATION',
  DEVICE = 'DEVICE',
  SYSTEM = 'SYSTEM',
  EXTERNAL_IDENTITY = 'EXTERNAL_IDENTITY',
  API_CLIENT = 'API_CLIENT',
  AUTOMATION = 'AUTOMATION',
  AGENT = 'AGENT',
}

export class CreateIdentityDto {
  @IsEnum(IdentityTypeDto)
  type: string;

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
  confidence?: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
