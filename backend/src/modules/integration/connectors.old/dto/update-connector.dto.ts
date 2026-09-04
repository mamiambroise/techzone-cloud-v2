import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConnectorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
