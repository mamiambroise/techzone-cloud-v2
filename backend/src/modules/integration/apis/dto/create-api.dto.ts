import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum ApiAuthenticationTypeEnum {
  NONE = 'NONE',
  API_KEY = 'API_KEY',
  BEARER = 'BEARER',
  OAUTH2 = 'OAUTH2',
  BASIC = 'BASIC',
  CUSTOM = 'CUSTOM',
}

export class CreateApiDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'apiCode must be lowercase alphanumeric with hyphens',
  })
  apiCode!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, {
    message: 'version must follow semver format (e.g. 1.0.0 or 1.0.0-beta.1)',
  })
  version!: string;

  @IsNotEmpty()
  @IsString()
  basePath!: string;

  @IsNotEmpty()
  operations!: Record<string, unknown>[];

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
