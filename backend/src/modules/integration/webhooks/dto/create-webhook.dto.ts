import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export enum WebhookDirectionEnum {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class CreateWebhookDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'code must be lowercase alphanumeric with hyphens',
  })
  code!: string;

  @IsNotEmpty()
  @IsEnum(WebhookDirectionEnum)
  direction!: WebhookDirectionEnum;

  @IsNotEmpty()
  @IsString()
  event!: string;

  @IsNotEmpty()
  @IsString()
  endpoint!: string;

  @IsOptional()
  @IsString()
  secretRef?: string;

  @IsOptional()
  signaturePolicy?: {
    algorithm?: 'sha256' | 'sha1';
    headerName?: string;
    toleranceSeconds?: number;
  };

  @IsOptional()
  retryPolicy?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
  };

  @IsOptional()
  @IsInt()
  @Min(100)
  timeout?: number;

  @IsOptional()
  filters?: Record<string, unknown>;
}
