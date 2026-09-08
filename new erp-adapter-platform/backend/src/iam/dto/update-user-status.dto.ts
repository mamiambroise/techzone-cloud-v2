import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'DISABLED'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}