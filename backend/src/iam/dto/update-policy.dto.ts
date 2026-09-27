import { IsEnum, IsInt, IsOptional, IsString, IsObject } from 'class-validator';
import { PolicyStatusDto, PolicyEffectDto } from './create-policy.dto';

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PolicyStatusDto)
  status?: string;

  @IsOptional()
  @IsEnum(PolicyEffectDto)
  effect?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  subjectType?: string;

  @IsOptional()
  @IsString()
  subjectRef?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
