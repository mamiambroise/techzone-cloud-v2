import { IsOptional, IsString, IsEnum, IsBoolean, IsArray, IsUUID, MaxLength } from 'class-validator';
import { BmFeatureStatus, BmCapabilityStatus, BmDependencyType } from '../../../../generated/prisma/enums';

export class CreateFeatureDto {
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
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateCapabilityDto {
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
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredEntities?: string[];

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateCapabilityDependencyDto {
  @IsString()
  targetCapabilityCode: string;

  @IsEnum(BmDependencyType)
  dependencyType: BmDependencyType;

  @IsOptional()
  configuration?: Record<string, unknown>;
}

export class CreateVersionFeatureDto {
  @IsString()
  @MaxLength(100)
  featureCode: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  activationStrategy?: string;

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateVersionCapabilityDto {
  @IsString()
  @MaxLength(100)
  featureCode: string;

  @IsString()
  @MaxLength(100)
  capabilityCode: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(BmFeatureStatus)
  status?: BmFeatureStatus;
}

export class UpdateCapabilityDto {
 @IsOptional() @IsString() @MaxLength(255) name?: string;
 @IsOptional() @IsString() description?: string;
 @IsOptional() @IsBoolean() required?: boolean;
}
