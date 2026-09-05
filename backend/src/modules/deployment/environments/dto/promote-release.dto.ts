import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PromoteReleaseDto {
  @IsString()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  targetEnvironmentId: string;

  @IsString()
  @IsNotEmpty()
  startedBy: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}
