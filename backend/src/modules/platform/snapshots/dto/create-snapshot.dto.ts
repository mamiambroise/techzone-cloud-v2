import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateSnapshotDto {
  @IsUUID()
  applicationId: string;

  @IsUUID()
  applicationVersionId: string;

  @IsUUID()
  environmentId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
