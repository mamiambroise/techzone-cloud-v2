import { IsOptional, IsString, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { RoleStatusDto } from './create-role.dto';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RoleStatusDto)
  status?: string;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
