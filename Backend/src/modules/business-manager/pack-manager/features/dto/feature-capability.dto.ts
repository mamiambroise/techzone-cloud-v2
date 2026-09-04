import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { PackCapabilityScope, PackCapabilityStatus, PackCapabilityType, PackFeatureCapabilityRelation, PackFeatureType, PackFeatureVisibility } from '../../../../../common/enums';

export class CreateFeatureDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/) code: string;
  @IsString() name: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(PackFeatureType) featureType: PackFeatureType;
  @IsOptional() @IsBoolean() enabled = true;
  @IsOptional() @IsBoolean() defaultEnabled = false;
  @IsOptional() @IsEnum(PackFeatureVisibility) visibility?: PackFeatureVisibility;
  @IsOptional() @IsString() moduleId?: string;
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateFeatureDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(PackFeatureType) featureType?: PackFeatureType;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsBoolean() defaultEnabled?: boolean;
  @IsOptional() @IsEnum(PackFeatureVisibility) visibility?: PackFeatureVisibility;
  @IsOptional() @IsString() moduleId?: string;
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsString() expectedVersion?: string;
}

export class CreateCapabilityDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*){2,}$/) code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(PackCapabilityType) capabilityType: PackCapabilityType;
  @IsEnum(PackCapabilityScope) scope: PackCapabilityScope;
  @IsOptional() @IsEnum(PackCapabilityStatus) status?: PackCapabilityStatus;
  @IsOptional() @IsString() contractRef?: string;
  @IsOptional() @IsString() contractVersion?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class AttachCapabilityDto {
  @IsString() capabilityId: string;
  @IsEnum(PackFeatureCapabilityRelation) relationType: PackFeatureCapabilityRelation;
  @IsOptional() @IsBoolean() required = false;
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
}

export class FeatureQueryDto {
  @IsOptional() @IsString() moduleId?: string;
  @IsOptional() @IsEnum(PackFeatureType) featureType?: PackFeatureType;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() search?: string;
}

export class CapabilityQueryDto {
  @IsOptional() @IsEnum(PackCapabilityType) type?: PackCapabilityType;
  @IsOptional() @IsEnum(PackCapabilityScope) scope?: PackCapabilityScope;
  @IsOptional() @IsEnum(PackCapabilityStatus) status?: PackCapabilityStatus;
  @IsOptional() @IsString() namespace?: string;
  @IsOptional() @IsString() search?: string;
}
