import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  applicationVersionId: string;

  @IsString()
  @IsNotEmpty()
  snapshotId: string;

  @IsString()
  @IsNotEmpty()
  configurationVersion: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsOptional()
  artifactRefs?: Record<string, unknown>;

  @IsOptional()
  contractVersions?: Record<string, string>;
}
