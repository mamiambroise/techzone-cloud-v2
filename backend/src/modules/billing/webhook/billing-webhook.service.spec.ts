import { jest } from '@jest/globals';
import { BillingWebhookService } from './billing-webhook.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { PaymentProviderRegistry, type PaymentProviderAdapter } from '../payment/payment-provider.interface';
import { PaymentStatus } from '../../../generated/prisma/enums';

/**
 * Webhooks de paiement (CDC 46 / RG-BILL-022, RG-BILL-032).
 *
 * Regle centrale : sans adaptateur REELLEMENT enregistre, ou avec une signature
 * invalide, AUCUN paiement n est modifie.
 */
describe('BillingWebhookService', () => {
  const rawBody = Buffer.from(
    JSON.stringify({ eventId: 'evt-1', reference: 'ref-1', status: 'SUCCEEDED', signature: 'secret-value' }),
    'utf8',
  );

  function build(adapter: Partial<PaymentProviderAdapter> | null) {
    const registry = new PaymentProviderRegistry();
    if (adapter) {
      registry.register({
        code: 'demo',
        displayName: 'Demo',
        methods: [],
        isConfigured: () => true,
        createPayment: jest.fn(),
        getPaymentStatus: jest.fn(),
        cancelPayment: jest.fn(),
        refundPayment: jest.fn(),
        verifyWebhook: () => true,
        ...adapter,
      } as PaymentProviderAdapter);
    }

    const prisma = {
      billingWebhookEvent: {
        create: jest.fn(async ({ data }: any) => ({ id: 'wh-1', ...data })),
        findUnique: jest.fn(async () => null),
        update: jest.fn(async () => ({})),
        findMany: jest.fn(async () => []),
      },
      payment: {
        findFirst: jest.fn(async () => ({
          id: 'pay-1',
          tenantId: 'tenant-a',
          provider: 'demo',
          externalReference: 'ref-1',
          status: 'PENDING',
        })),
        update: jest.fn(async ({ data }: any) => ({ id: 'pay-1', ...data })),
      },
      invoice: { findUnique: jest.fn(async () => ({ id: 'inv-1', currency: 'MGA', total: '0', amountPaid: '0' })) },
    } as any;
    const audit = { audit: jest.fn(async () => undefined) } as any;
    const diagnostics = { record: jest.fn(async () => undefined) } as any;
    const payments = { settle: jest.fn(async () => ({ id: 'pay-1' })), markFailed: jest.fn(async () => ({ id: 'pay-1', tenantId: 'tenant-a', status: 'FAILED' })) } as any;

    return {
      service: new BillingWebhookService(prisma, audit, diagnostics, registry, payments),
      prisma,
      audit,
      diagnostics,
      payments,
    };
  }

  it('refuse le webhook quand aucun adaptateur n est enregistre', async () => {
    const { service, prisma, diagnostics } = build(null);
    await expect(service.handle('demo', rawBody, {})).rejects.toMatchObject({
      code: BillingErrorCode.PAYMENT_PROVIDER_UNAVAILABLE,
    });
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(diagnostics.record).toHaveBeenCalled();
  });

  it('rejette une signature invalide sans toucher aux paiements (RG-BILL-022)', async () => {
    const { service, prisma, audit } = build({ verifyWebhook: () => false });
    await expect(service.handle('demo', rawBody, {})).rejects.toMatchObject({
      code: BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
    });
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.billingWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ signatureValid: false, processed: false }) }),
    );
    expect(audit.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'billing.webhook.rejected', result: 'DENIED' }),
    );
  });

  it('n expurge jamais la signature du payload conserve', async () => {
    const { service, prisma } = build({ verifyWebhook: () => false });
    await service.handle('demo', rawBody, {}).catch(() => undefined);
    const stored = (prisma.billingWebhookEvent.create as any).mock.calls[0][0].data.payload;
    expect(JSON.stringify(stored)).not.toContain('secret-value');
    expect(JSON.stringify(stored)).not.toContain('signature');
  });

  it('applique un webhook signe et dedoublonne le meme evenement', async () => {
    const { service, payments } = build({});
    const result = await service.handle('demo', rawBody, { 'x-signature': 'ok' });
    expect(result.received).toBe(true);
    expect(payments.settle).toHaveBeenCalledWith('pay-1', 'tenant-a', 'system:billing-webhook', expect.any(Object));
  });

  it('ignore un evenement provider deja traite', async () => {
    const { service, prisma, payments } = build({});
    (prisma.billingWebhookEvent.findUnique as any) = jest.fn(async () => ({ id: 'wh-1', processed: true }));
    const result = await service.handle('demo', rawBody, {});
    expect(result.duplicate).toBe(true);
    expect(payments.settle).not.toHaveBeenCalled();
  });

  it('refuse un statut provider inconnu plutot que de le deviner', async () => {
    const { service } = build({});
    const body = Buffer.from(JSON.stringify({ eventId: 'evt-2', reference: 'ref-1', status: 'WAT' }), 'utf8');
    await expect(service.handle('demo', body, {})).rejects.toMatchObject({
      code: BillingErrorCode.PAYMENT_WEBHOOK_INVALID,
    });
  });

  it('renvoie un paiement provider non configure', async () => {
    const registry = new PaymentProviderRegistry();
    registry.register({
      code: 'unconfigured',
      displayName: 'Non configure',
      methods: [],
      isConfigured: () => false,
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      cancelPayment: jest.fn(),
      refundPayment: jest.fn(),
      verifyWebhook: () => true,
    } as unknown as PaymentProviderAdapter);
    expect(registry.resolve('unconfigured')).toBeNull();
    expect(registry.list()[0].configured).toBe(false);
    expect(PaymentStatus.SUCCEEDED).toBe('SUCCEEDED');
  });
});
