import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { WebhookDirection } from '../../../../generated/prisma/enums';

export class CreateWebhookDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  code: string;

  @IsEnum(WebhookDirection)
  direction: WebhookDirection;

  @IsString()
  @MaxLength(150)
  event: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  secretRef?: string;

  @IsOptional()
  @IsObject()
  signaturePolicy?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  retryPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeout?: number;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  event?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  secretRef?: string;

  @IsOptional()
  @IsObject()
  signaturePolicy?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  retryPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeout?: number;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}

export class SendWebhookDto {
  @IsString()
  eventId: string;

  @IsObject()
  payload: Record<string, unknown>;
}
