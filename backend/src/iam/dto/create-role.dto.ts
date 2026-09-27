import { IsOptional, IsString, IsInt, IsBoolean, IsObject } from 'class-validator';

export enum RoleStatusDto {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
