import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import {
  EnvironmentStatus,
  EnvironmentType,
} from '../../../../generated/prisma/enums';

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(EnvironmentType)
  type: EnvironmentType;

  @IsOptional()
  @IsEnum(EnvironmentStatus)
  status?: EnvironmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  configurationRef?: string;
}
