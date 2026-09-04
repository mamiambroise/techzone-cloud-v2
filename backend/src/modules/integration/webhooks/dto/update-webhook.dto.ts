import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  endpoint?: string;

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
