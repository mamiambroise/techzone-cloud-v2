import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tenantScope?: string;
}
