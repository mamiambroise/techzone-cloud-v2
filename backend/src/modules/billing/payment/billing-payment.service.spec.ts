import { jest } from '@jest/globals';
import { BillingPaymentService } from './billing-payment.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { PaymentStatus } from '../../../generated/prisma/enums';

/**
 * Paiements : idempotence (RG-BILL-021), separation des permissions
 * (CDC 49) et refus du paiement d'un autre tenant (RG-BILL-027).
 */
describe('BillingPaymentService', () => {
  const invoice = {
    id: 'inv-1',
    tenantId: 'tenant-a',
    invoiceNumber: 'TC-202610-00001',
    currency: 'MGA',
    total: { toString: () => '10000.00' },
    amountDue: { toString: () => '10000.00' },
    amountPaid: { toString: () => '0.00' },
    status: 'OPEN',
  };

  function build(overrides: Record<string, unknown> = {}) {
    const paymentDelegate = {
      // Aucune ligne de paiement preexistante : la recherche d idempotence ne
      // trouve rien par defaut (un rejeu est donc un vrai rejeu).
      findUnique: jest.fn(async () => null),
      findFirst: jest.fn(async () => null),
      update: jest.fn(async ({ where }: any) => ({ id: where.id, tenantId: 'tenant-a', status: 'SUCCEEDED' })),
      create: jest.fn(async ({ data }: any) => ({ id: 'pay-1', ...data })),
    };
    const prisma = {
      payment: paymentDelegate,
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      ...overrides,
    } as any;

    const audit = { audit: jest.fn(async () => undefined), emit: jest.fn(async () => undefined) } as any;
    const invoices = {
      getScoped: jest.fn(async (id: string, tenantId: string | null) => {
        if (tenantId !== null && tenantId !== invoice.tenantId) {
          const error = new Error('CROSS_TENANT_ACCESS_DENIED');
          throw error;
        }
        return invoice;
      }),
      assertPayable: jest.fn(),
      recomputePaidState: jest.fn(async () => ({})),
    } as any;
    const lifecycle = {
      onPaymentSucceeded: jest.fn(async () => undefined),
      onPaymentFailure: jest.fn(async () => undefined),
    } as any;
    const providers = { list: () => [], size: 0, resolve: () => null } as any;
    const diagnostics = { record: jest.fn(async () => undefined) } as any;

    const service = new BillingPaymentService(prisma, audit, invoices, lifecycle, providers, diagnostics);
    return { service, prisma, audit, invoices, lifecycle };
  }

  it('enregistre un paiement manuel et le comptabilise', async () => {
    const { service, prisma, invoices, lifecycle } = build();
    // Modele faithfule : la ligne n'existe pas avant creation, puis elle est
    // relue par la comptabilisation.
    let stored: Record<string, unknown> | null = null;
    (prisma.payment.findUnique as any) = jest.fn(async () => stored);
    (prisma.payment.create as any) = jest.fn(async ({ data }: any) => {
      stored = { id: 'pay-1', ...data };
      return stored;
    });
    const result = await service.recordManualPayment('tenant-a', 'user-1', {
      invoiceId: 'inv-1',
      amount: '10000.00',
      method: 'MANUAL' as never,
      validate: true,
      idempotencyKey: 'k1',
    });

    expect(result.duplicate).toBe(false);
    expect(invoices.recomputePaidState).toHaveBeenCalledWith('inv-1');
    expect(lifecycle.onPaymentSucceeded).toHaveBeenCalledWith('tenant-a', 'inv-1', expect.any(String), 'user-1');
  });

  it('ne cree jamais deux debits pour la meme cle d idempotence', async () => {
    const existing = { id: 'pay-existing', tenantId: 'tenant-a', status: 'SUCCEEDED' };
    const { service, prisma } = build({
      payment: {
        findUnique: jest.fn(async () => existing),
        create: jest.fn(),
      },
    } as any);

    const result = await service.recordManualPayment('tenant-a', 'user-1', {
      invoiceId: 'inv-1',
      amount: '100.00',
      idempotencyKey: 'same-key',
    });

    expect(result.duplicate).toBe(true);
    expect(result.payment).toBe(existing);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('refuse un paiement dans une autre devise que la facture (RG-BILL-007)', async () => {
    const { service } = build();
    await expect(
      service.recordManualPayment('tenant-a', 'user-1', {
        invoiceId: 'inv-1',
        amount: '10.00',
        currency: 'EUR',
      }),
    ).rejects.toMatchObject({ code: BillingErrorCode.CURRENCY_MISMATCH });
  });

  it('refuse un paiement superieur au reste a payer', async () => {
    const { service } = build();
    await expect(
      service.recordManualPayment('tenant-a', 'user-1', {
        invoiceId: 'inv-1',
        amount: '999999.00',
      }),
    ).rejects.toMatchObject({ code: BillingErrorCode.AMOUNT_INVALID });
  });

  it('refuse un montant nul ou negatif', async () => {
    const { service } = build();
    await expect(
      service.recordManualPayment('tenant-a', 'user-1', { invoiceId: 'inv-1', amount: '0.00' }),
    ).rejects.toMatchObject({ code: BillingErrorCode.AMOUNT_INVALID });
  });

  it('refuse toute operation sur un paiement d un autre tenant', async () => {
    const { service, prisma } = build();
    (prisma.payment.findUnique as any) = jest.fn(async () => ({
      id: 'pay-1',
      tenantId: 'tenant-b',
      method: 'MANUAL',
      status: 'PENDING',
    }));
    await expect(
      service.validateManualPayment('pay-1', 'tenant-a', 'user-1'),
    ).rejects.toMatchObject({ code: BillingErrorCode.CROSS_TENANT_ACCESS_DENIED });
  });

  it('refuse de revalider un paiement deja abouti (idempotence metier)', async () => {
    const { service, prisma } = build();
    (prisma.payment.findUnique as any) = jest.fn(async () => ({
      id: 'pay-1',
      tenantId: 'tenant-a',
      method: 'MANUAL',
      status: PaymentStatus.SUCCEEDED,
    }));
    await expect(service.validateManualPayment('pay-1', 'tenant-a', 'user-1')).rejects.toMatchObject({
      code: BillingErrorCode.PAYMENT_DUPLICATE,
    });
  });

  it('refuse la validation manuelle d un paiement non manuel', async () => {
    const { service, prisma } = build();
    (prisma.payment.findUnique as any) = jest.fn(async () => ({
      id: 'pay-1',
      tenantId: 'tenant-a',
      method: 'CARD',
      status: PaymentStatus.PENDING,
    }));
    await expect(service.validateManualPayment('pay-1', 'tenant-a', 'user-1')).rejects.toMatchObject({
      code: BillingErrorCode.BILLING_CONFIGURATION_INVALID,
    });
  });

  it('n advertit aucun provider de paiement simule', () => {
    const { service } = build();
    const status = service.providersStatus();
    expect(status.count).toBe(0);
    expect(status.registered).toEqual([]);
    expect(status.policy).toContain('manuel');
  });
});
