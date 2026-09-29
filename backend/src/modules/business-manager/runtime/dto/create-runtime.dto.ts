import { IsOptional, IsString, IsEnum, IsObject, IsUUID, MaxLength } from 'class-validator';
import { BmNavigationStatus, BmRuntimeReadiness } from '../../../../generated/prisma/enums';

export class CreateRuntimeManifestDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  manifest?: Record<string, unknown>;
}

export class CreateRuntimeBindingDto {
  @IsString()
  targetType: string;

  @IsString()
  targetId: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class UpdateRuntimeBindingDto {
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(BmRuntimeReadiness)
  status?: BmRuntimeReadiness;
}
