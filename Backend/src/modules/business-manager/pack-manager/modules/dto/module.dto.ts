import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PackModuleType } from '../../../../../common/enums';

export class CreateModuleDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]{1,63}$/) code: string;
  @IsString() name: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(PackModuleType) moduleType: PackModuleType;
  @IsOptional() @IsBoolean() enabled = true;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(PackModuleType) moduleType?: PackModuleType;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsString() expectedVersion?: string;
}

export class DuplicateModuleDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]{1,63}$/) code: string;
  @IsString() name: string;
}

export class ReorderModuleItemDto {
  @IsString() moduleId: string;
  @IsInt() @Min(0) @Max(100000) displayOrder: number;
}

export class ReorderModulesDto {
  @IsArray() items: ReorderModuleItemDto[];
}

export class ModuleQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(PackModuleType) moduleType?: PackModuleType;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
}
