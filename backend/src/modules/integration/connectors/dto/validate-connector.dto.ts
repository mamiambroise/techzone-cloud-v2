import { IsOptional, IsObject } from 'class-validator';

export class ValidateConnectorDto {
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}
