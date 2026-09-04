import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DispatchWebhookDto {
  @IsNotEmpty()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  eventId?: string;
}
