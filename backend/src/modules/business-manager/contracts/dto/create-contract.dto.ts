import { IsOptional, IsString, IsObject, MaxLength } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  manifest?: Record<string, unknown>;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  manifest?: Record<string, unknown>;
}
