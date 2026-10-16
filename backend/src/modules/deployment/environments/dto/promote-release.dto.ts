import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PromoteReleaseDto {
  @IsString()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  targetEnvironmentId: string;

  /**
   * Deprecated compatibility field. Promotion audit data is always taken from
   * the authenticated principal by the service.
   */
  @IsOptional()
  @IsString()
  startedBy?: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}
