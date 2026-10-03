import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { BillingInvoiceService } from './billing-invoice.service';
import { BillingErrorCode } from '../common/billing-error-code';

/**
 * Factures : totaux en unites mineures, pas de double facture pour une meme
 * periode, et aucune conversion implicite entre devises (RG-BILL-006/007/009).
 */
describe('BillingInvoiceService', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const prisma = {
      invoice: {
        findUnique: jest.fn(async () => null),
        findFirst: jest.fn(async () => null),
        findMany: jest.fn(async () => []),
        create: jest.fn(async ({ data }: any) => ({ id: 'inv-new', ...data, items: [] })),
        update: jest.fn(async ({ data }: any) => ({ id: 'inv-1', ...data })),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      ...overrides,
    } as any;
    const audit = { audit: jest.fn(async () => undefined), emit: jest.fn(async () => undefined) } as any;
    const numbering = {
      next: jest.fn(async () => 'TC-202610-00001'),
      assertAvailable: jest.fn(async () => undefined),
    } as any;
    return { service: new BillingInvoiceService(prisma, audit, numbering), prisma, audit, numbering };
  }

  it('calcule les totaux a partir des lignes, en entiers', () => {
    const { service } = build();
    const totals = service.computeTotals(
      [
        { description: 'Abonnement Starter', quantity: 1, unitPrice: '50000.00', currency: 'MGA' },
        { description: 'Utilitaire', quantity: 2, unitPrice: '1500.25', currency: 'MGA' },
      ],
      'MGA',
    );
    expect(totals.subtotal.toDecimalString()).toBe('53000.50');
    expect(totals.taxTotal.toDecimalString()).toBe('0.00');
    expect(totals.creditApplied.toDecimalString()).toBe('0.00');
  });

  it('applique la quantite sans derive de centimes', () => {
    const { service } = build();
    const totals = service.computeTotals(
      [{ description: 'Pack', quantity: 3, unitPrice: '33.33', currency: 'EUR' }],
      'EUR',
    );
    expect(totals.subtotal.toDecimalString()).toBe('99.99');
  });

  it('refuse un melange de devises dans une meme facture', () => {
    const { service } = build();
    expect(() =>
      service.computeTotals(
        [
          { description: 'A', quantity: 1, unitPrice: '10.00', currency: 'MGA' },
          { description: 'B', quantity: 1, unitPrice: '10.00', currency: 'EUR' },
        ],
        'MGA',
      ),
    ).toThrow(/CURRENCY_MISMATCH|MGA/);
  });

  it('refuse un montant de ligne invalide', () => {
    const { service } = build();
    expect(() =>
      service.computeTotals([{ description: 'A', quantity: 1, unitPrice: 'abc', currency: 'MGA' }], 'MGA'),
    ).toThrow();
    expect(() =>
      service.computeTotals([{ description: 'A', quantity: -2, unitPrice: '10.00', currency: 'MGA' }], 'MGA'),
    ).toThrow();
  });

  it('refuse une facture sans ligne explicable (CDC 34)', async () => {
    const { service } = build();
    await expect(
      service.create({ tenantId: 'tenant-a', lines: [] }, 'user-1'),
    ).rejects.toMatchObject({ code: BillingErrorCode.INVOICE_INVALID_STATE });
  });

  it('fige le prix dans la ligne et n invente aucun taxe', async () => {
    const { service, prisma } = build();
    await service.create(
      {
        tenantId: 'tenant-a',
        lines: [{ description: 'Abonnement', quantity: 1, unitPrice: '75000.00', currency: 'MGA', priceId: 'price-1' }],
      },
      'user-1',
    );

    const call = (prisma.invoice.create as any).mock.calls[0][0];
    expect(call.data.subtotal.toFixed(2)).toBe('75000.00');
    expect(call.data.taxTotal.toFixed(2)).toBe('0.00');
    expect(call.data.total.toFixed(2)).toBe('75000.00');
    expect(call.data.amountDue.toFixed(2)).toBe('75000.00');
    expect(call.data.items.create[0].unitPrice.toFixed(2)).toBe('75000.00');
    expect(call.data.items.create[0].priceId).toBe('price-1');
  });

  it('refuse une facture DRAFT sans numero disponible', async () => {
    const { service, numbering } = build();
    numbering.assertAvailable = jest.fn(async () => {
      throw Object.assign(new Error('deja utilise'), { code: BillingErrorCode.INVOICE_INVALID_STATE });
    }) as any;
    await expect(
      service.create(
        { tenantId: 'tenant-a', lines: [{ description: 'A', quantity: 1, unitPrice: '10.00', currency: 'MGA' }] },
        'user-1',
      ),
    ).rejects.toThrow(/deja utilise/);
  });

  it('ne cree pas de doublon pour une periode deja facturee', async () => {
    const subscription = {
      id: 'sub-1',
      tenantId: 'tenant-a',
      priceId: 'price-1',
      billingAccountId: null,
      plan: { name: 'Starter' },
      billingAccount: null,
      price: { id: 'price-1', amount: { toString: () => '50000.00' }, currency: 'MGA', interval: 'MONTHLY' },
      currentPeriodStart: new Date('2026-10-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-11-01T00:00:00.000Z'),
    };
    const { service } = build({
      subscription: { findFirst: jest.fn(async () => subscription) },
      invoice: { findFirst: jest.fn(async () => ({ id: 'inv-existing', invoiceNumber: 'TC-202610-00001' })) },
    } as any);

    await expect(
      service.generateForSubscription('sub-1', 'tenant-a', 'user-1', {
        period: {
          start: new Date('2026-10-01T00:00:00.000Z'),
          end: new Date('2026-11-01T00:00:00.000Z'),
        },
      }),
    ).rejects.toMatchObject({ code: BillingErrorCode.INVOICE_INVALID_STATE });
  });

  it('refuse de generer une facture sans prix (RG-BILL-005)', async () => {
    const { service } = build({
      subscription: {
        findFirst: jest.fn(async () => ({ id: 'sub-1', tenantId: 'tenant-a', priceId: null, plan: { name: 'Starter' } })),
      },
    } as any);
    await expect(service.generateForSubscription('sub-1', 'tenant-a', 'user-1')).rejects.toMatchObject({
      code: BillingErrorCode.PRICE_NOT_FOUND,
    });
  });

  it('interdit de payer une facture annulee ou deja soldee', () => {
    const { service } = build();
    expect(() => service.assertPayable({ status: 'VOID' as never })).toThrow();
    expect(() => service.assertPayable({ status: 'PAID' as never })).toThrow();
    expect(() => service.assertPayable({ status: 'OPEN' as never })).not.toThrow();
    expect(() => service.assertPayable({ status: 'PARTIALLY_PAID' as never })).not.toThrow();
  });

  it('ne lit jamais la facture d un autre tenant (RG-BILL-027)', async () => {
    const { service } = build();
    (service as any).prisma.invoice.findUnique = jest.fn(async () => ({
      id: 'inv-1',
      tenantId: 'tenant-b',
    }));
    await expect(service.getScoped('inv-1', 'tenant-a')).rejects.toMatchObject({
      code: BillingErrorCode.CROSS_TENANT_ACCESS_DENIED,
    });
    await expect(service.getScoped('inv-1', 'tenant-b')).resolves.toMatchObject({ id: 'inv-1' });
  });

  it('expose des erreurs HTTP explicites et corrélables', async () => {
    const { service } = build();
    (service as any).prisma.invoice.findUnique = jest.fn(async () => null);
    const error = await service.getScoped('inconnue', 'tenant-a').catch((raised: any) => raised);
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.traceId).toBeTruthy();
    expect(error.getResponse()).toMatchObject({ success: false, code: BillingErrorCode.INVOICE_NOT_FOUND });
  });
});
