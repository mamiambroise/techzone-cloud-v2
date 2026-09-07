import { IsOptional, IsString } from 'class-validator';

export class QueryHistoryDto {
  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  deploymentId?: string;

  @IsOptional()
  @IsString()
  environmentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  traceId?: string;
}
