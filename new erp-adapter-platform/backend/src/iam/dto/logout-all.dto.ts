import { IsBoolean, IsOptional } from 'class-validator';

export class LogoutAllDto {
  @IsOptional()
  @IsBoolean()
  keepCurrentSession?: boolean;
}