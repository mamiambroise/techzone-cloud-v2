import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApplicationVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version: string;

  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdFrom?: string;
}
