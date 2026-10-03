import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';

/**
 * Numerotation de facture (CDC 35).
 *
 * Exigences CDC 35 : unique, stable, non ambigu, auditable, et JAMAIS modifiee
 * silencieusement pour une facture emise. La regle de format est configurable
 * (BILLING_INVOICE_NUMBER_FORMAT) car elle depend des besoins administratifs
 * et comptables reels — aucun numero n est invente ici.
 */

const DEFAULT_FORMAT = 'TC-{YYYY}{MM}-{SEQ}';

@Injectable()
export class BillingInvoiceNumberService {
  constructor(private readonly prisma: PrismaService) {}

  private get format(): string {
    return process.env.BILLING_INVOICE_NUMBER_FORMAT ?? DEFAULT_FORMAT;
  }

  private get prefix(): string {
    const match = /^(.*?)\{/.exec(this.format);
    return match?.[1] ?? 'TC-';
  }

  async next(tenantId: string, at = new Date()): Promise<string> {
    const year = at.getUTCFullYear();
    const month = String(at.getUTCMonth() + 1).padStart(2, '0');
    const series = `${this.prefix}${year}${month}-`;
    const like = `${series}%`;

    // La sequence est derivee du maximum deja attribue dans la serie : deux
    // appels concurrents lisent le meme maximum, la contrainte unique
    // `invoice_invoiceNumber_key` tranche et l'appelant rejoue.
    const last = await this.prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber: { startsWith: like } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let lastSequence = 0;
    if (last) {
      const parsed = Number(last.invoiceNumber.slice(series.length));
      if (Number.isFinite(parsed) && parsed > 0) lastSequence = parsed;
    }

    return this.format
      .replace('{YYYY}', String(year))
      .replace('{MM}', month)
      .replace('{SEQ}', String(lastSequence + 1).padStart(5, '0'))
      .replace('{TENANT}', tenantId.slice(0, 8));
  }

  async assertAvailable(number: string): Promise<void> {
    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: number },
      select: { id: true },
    });
    if (existing) {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        `Le numero de facture ${number} est deja utilise : la numerotation doit rester unique et stable (CDC 35).`,
        { invoiceNumber: number },
      );
    }
  }
}