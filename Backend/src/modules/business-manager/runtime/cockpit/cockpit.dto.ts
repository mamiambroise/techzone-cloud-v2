import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RuntimeCockpitQueryDto {
  @IsOptional() @IsString() applicationId?: string;
  @IsOptional() @IsString() packCode?: string;
  @IsOptional() @IsString() packVersion?: string;
  @IsOptional() @IsString() environment?: string;
  @IsOptional() @IsIn(['RESOLVED', 'PARTIALLY_RESOLVED', 'BLOCKED', 'DEGRADED', 'ERROR']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class RuntimeAttentionQueryDto {
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class RuntimeCacheInvalidateDto {
  @IsString() @IsIn(['ALL', 'TENANT', 'APPLICATION', 'PACK']) scope: string;
  @IsOptional() @IsString() applicationId?: string;
  @IsOptional() @IsString() packCode?: string;
  @IsOptional() @IsString() reason?: string;
}
