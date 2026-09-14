import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,

} from 'class-validator';

import {
  ConfigurationScope,
  ConfigurationType,
} from '../../../../generated/prisma/enums';

export class CreateConfigurationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  key: string;

  @IsEnum(ConfigurationScope)
  scope: ConfigurationScope;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  scopeId?: string;

  @IsEnum(ConfigurationType)
  type: ConfigurationType;

  @IsOptional()
  value?: unknown;

  @IsOptional()
  defaultValue?: unknown;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsOptional()
  @IsObject()
  schema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/)
  version?: string;
}
