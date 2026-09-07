import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EnvironmentRollbackDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  startedBy: string;

  @IsOptional()
  @IsString()
  toReleaseId?: string;
}
