import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional() @IsString() applicationId?: string;
  @IsOptional() @IsString() applicationVersionId?: string;
  @IsOptional() @IsString() environment?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() validationStatus?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() @MaxLength(120) search?: string;
}

export class DashboardAttentionQueryDto {
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsString() limit = '20';
}

export class DashboardActivityQueryDto {
  @IsOptional() @IsString() eventType?: string;
  @IsOptional() @IsString() packId?: string;
  @IsOptional() @IsString() limit = '20';
}
