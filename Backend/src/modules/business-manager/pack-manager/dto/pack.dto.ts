import { IsArray, IsEnum, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PackChangeType, PackSourceType } from '../../../../common/enums';

export class CreatePackDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]{2,63}$/) code: string;
  @IsString() @MinLength(1) @MaxLength(255) name: string;
  @IsOptional() @IsString() @MaxLength(120) shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() logoRef?: string;
  @IsOptional() @IsEnum(PackSourceType) sourceType?: PackSourceType;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdatePackDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(120) shortName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() logoRef?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsString() expectedVersion?: string;
}


export class CreatePackVersionDto {
  @IsString() @Matches(/^\\d+\\.\\d+\\.\\d+$/) versionNumber: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sourceVersionId?: string;
  @IsOptional() @IsEnum(PackChangeType) changeType?: PackChangeType;
  @IsOptional() @IsObject() releaseNotes?: Record<string, unknown>;
}

export class UpdatePackVersionDto {
  @IsOptional() @IsArray() modules?: Record<string, unknown>[];
  @IsOptional() @IsArray() features?: string[];
  @IsOptional() @IsArray() capabilities?: string[];
  @IsOptional() @IsArray() dependencies?: Record<string, unknown>[];
  @IsOptional() @IsArray() activationRules?: Record<string, unknown>[];
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsEnum(PackChangeType) changeType?: PackChangeType;
  @IsOptional() @IsObject() releaseNotes?: Record<string, unknown>;
  @IsOptional() @IsString() expectedVersion?: string;
}
