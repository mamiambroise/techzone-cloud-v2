import { IsOptional, IsString } from 'class-validator';

export class UpdateApplicationVersionDto {
  @IsOptional()
  @IsString()
  releaseNotes?: string;
}
