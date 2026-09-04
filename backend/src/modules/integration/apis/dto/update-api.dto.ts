import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiAuthenticationTypeEnum } from './create-api.dto';

export class UpdateApiDto {
  @IsOptional()
  @IsString()
  basePath?: string;

  @IsOptional()
  operations?: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(ApiAuthenticationTypeEnum)
  authentication?: ApiAuthenticationTypeEnum;

  @IsOptional()
  authorization?: Record<string, unknown>;

  @IsOptional()
  rateLimit?: {
    limit: number;
    windowSec: number;
  };

  @IsOptional()
  requestSchema?: Record<string, unknown>;

  @IsOptional()
  responseSchema?: Record<string, unknown>;
}
