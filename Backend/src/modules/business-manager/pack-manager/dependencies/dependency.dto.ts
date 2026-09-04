import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { DependencyResolutionStatus, DependencySourceType, DependencyTargetType, DependencyType } from '../../../../common/enums';

export class CreateDependencyDto {
  @IsEnum(DependencySourceType) sourceType: DependencySourceType;
  @IsString() sourceId: string;
  @IsEnum(DependencyType) dependencyType: DependencyType;
  @IsEnum(DependencyTargetType) targetType: DependencyTargetType;
  @IsString() @MaxLength(255) targetRef: string;
  @IsOptional() @IsString() @MaxLength(120) targetVersionRange?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsString() conditionRef?: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() metadata?: Record<string, unknown>;
}

export class UpdateDependencyDto {
  @IsOptional() @IsEnum(DependencyType) dependencyType?: DependencyType;
  @IsOptional() @IsEnum(DependencyTargetType) targetType?: DependencyTargetType;
  @IsOptional() @IsString() @MaxLength(255) targetRef?: string;
  @IsOptional() @IsString() @MaxLength(120) targetVersionRange?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsString() conditionRef?: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() metadata?: Record<string, unknown>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) rowVersion?: number;
}

export class DependencyQueryDto {
  @IsOptional() @IsEnum(DependencyType) dependencyType?: DependencyType;
  @IsOptional() @IsEnum(DependencySourceType) sourceType?: DependencySourceType;
  @IsOptional() @IsEnum(DependencyTargetType) targetType?: DependencyTargetType;
  @IsOptional() @IsEnum(DependencyResolutionStatus) resolutionStatus?: DependencyResolutionStatus;
  @IsOptional() @Type(() => Boolean) @IsBoolean() required?: boolean;
  @IsOptional() @IsString() search?: string;
}
