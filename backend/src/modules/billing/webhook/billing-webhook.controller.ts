import { Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../iam/public.decorator';
import { BillingWebhookService } from './billing-webhook.service';

/**
 * Webhooks de paiement (CDC 46).
 *
 * Route publique par nature : un provider externe n'a pas de session IAM. La
 * securite ne repose donc PAS sur l'authentification mais sur la VERIFICATION
 * DE SIGNATURE realisee par l'adaptateur du provider (RG-BILL-022) :
 *  - aucun adaptateur enregistre -> 503 + diagnostic, aucun paiement modifie ;
 *  - signature invalide -> 400 + trace, aucun paiement modifie.
 */
@ApiTags('billing-webhooks')
@Controller('api/billing/webhooks')
export class BillingWebhookController {
  constructor(private readonly webhooks: BillingWebhookService) {}

  @Public()
  @Post(':provider')
  @ApiOperation({ summary: 'Reception d un webhook de paiement' })
  async receive(
    @Param('provider') provider: string,
    @Req() request: { rawBody?: Buffer; body?: unknown; headers: Record<string, string | string[] | undefined> },
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody =
      request.rawBody ??
      (Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(request.body ?? {}), 'utf8'));
    const result = await this.webhooks.handle(provider, rawBody, headers ?? request.headers);
    return { success: true, message: 'Webhook recu', data: result };
  }
}