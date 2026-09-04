import { IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PackQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() sourceType?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() archived?: boolean;
  @IsOptional() @IsString() createdBy?: string;
  @IsOptional() @IsDateString() updatedFrom?: string;
  @IsOptional() @IsDateString() updatedTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsIn(['name', 'code', 'createdAt', 'updatedAt', 'status', 'category']) sort = 'updatedAt';
  @IsOptional() @IsIn(['ASC', 'DESC']) order: 'ASC' | 'DESC' = 'DESC';
}

export class DuplicatePackDto {
  @IsString() @Matches(/^[a-z][a-z0-9_-]{2,63}$/) code: string;
  @IsString() name: string;
  @IsOptional() @IsString() shortName?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() cloneLatestVersion = false;
}

export class CloneVersionDto {
  @IsString() @Matches(/^\d+\.\d+\.\d+$/) versionNumber: string;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() changeType?: string;
  @IsOptional() @IsObject() releaseNotes?: Record<string, unknown>;
}

export class VersionQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() validationStatus?: string;
  @IsOptional() @IsString() manifestStatus?: string;
  @IsOptional() @IsString() changeType?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
