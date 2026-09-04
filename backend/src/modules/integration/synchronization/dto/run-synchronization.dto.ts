import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RunSynchronizationDto {
  @IsOptional()
  @IsBoolean()
  resumeFromCheckpoint?: boolean;

  @IsOptional()
  @IsString()
  overrideCursor?: string;
}
