import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  username: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  recoveryCode?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}
