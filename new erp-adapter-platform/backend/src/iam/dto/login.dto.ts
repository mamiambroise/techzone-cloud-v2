import { IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  environment?: string;
}