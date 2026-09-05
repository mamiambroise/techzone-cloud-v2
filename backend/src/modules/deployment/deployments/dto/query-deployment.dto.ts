import { IsOptional, IsString } from 'class-validator';

export class QueryDeploymentDto {
  @IsOptional()
  @IsString()
  environmentId?: string;

  @IsOptional()
  @IsString()
  releaseId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
