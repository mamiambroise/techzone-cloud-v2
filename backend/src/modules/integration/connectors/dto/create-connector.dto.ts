import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConnectorProviderType } from '../../../../generated/prisma/enums';

export class CreateConnectorDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(ConnectorProviderType)
  providerType: ConnectorProviderType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contractVersion?: string;

  @IsOptional()
  @IsObject()
  configurationSchema?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  credentialRef?: string;

  @IsOptional()
  @IsObject()
  capabilities?: Record<string, unknown>;
}
