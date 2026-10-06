import { jest } from '@jest/globals';
import { BillingLifecycleService } from './billing-lifecycle.service';
import { BillingErrorCode } from '../common/billing-error-code';
import { billingError } from '../common/billing.exception';
import { SubscriptionStatus, InvoiceStatus } from '../../../generated/prisma/enums';

/**
 * Cycle de vie recurrent (CDC 51/52/112/113) : la grace vient d une politique
 * configurable, jamais d une valeur codee en dur dans une transition.
 */
describe('BillingLifecycleService', () => {
  function build(subscriptionOverrides: Record<string, unknown> = {}, invoiceStatus: InvoiceStatus = InvoiceStatus.PAID) {
    const subscription = {
      id: 'sub-1',
      tenantId: 'tenant-a',
      status: SubscriptionStatus.ACTIVE,
      graceDays: null,
      ...subscriptionOverrides,
    };
    const prisma = {
      subscription: {
        findUnique: jest.fn(async () => subscription),
        findMany: jest.fn(async () => []),
        update: jest.fn(async () => subscription),
      },
      invoice: {
        findUnique: jest.fn(async () => ({
          id: 'inv-1',
          tenantId: 'tenant-a',
          subscriptionId: 'sub-1',
          status: invoiceStatus,
          invoiceNumber: 'TC-202610-00001',
        })),
        findMany: jest.fn(async () => []),
      },
    } as any;

    const audit = { audit: jest.fn(async () => undefined), emit: jest.fn(async () => undefined) } as any;
    const subs = {
      transition: jest.fn(async () => ({})),
      suspend: jest.fn(async () => ({})),
      cancel: jest.fn(async () => ({})),
      renew: jest.fn(async () => ({})),
    } as any;
    const invoices = { generateForSubscription: jest.fn(async () => ({})), markOverdue: jest.fn(async () => ({})) } as any;
    const entitlements = { invalidate: jest.fn() } as any;
    const diagnostics = { record: jest.fn(async () => undefined) } as any;

    const service = new BillingLifecycleService(prisma, audit, subs, invoices, entitlements, diagnostics);
    return { service, prisma, audit, subs, invoices, entitlements, diagnostics, subscription };
  }

  it('surcharge la grace de l abonnement avant la configuration plateforme', () => {
    const { service } = build({ graceDays: 3 });
    const previous = process.env.BILLING_GRACE_DAYS;
    process.env.BILLING_GRACE_DAYS = '30';
    try {
      expect(service.graceDaysFor({ graceDays: 3 })).toBe(3);
      expect(service.graceDaysFor({ graceDays: null })).toBe(30);
    } finally {
      if (previous === undefined) delete process.env.BILLING_GRACE_DAYS;
      else process.env.BILLING_GRACE_DAYS = previous;
    }
  });

  it('retombe sur une valeur documentee si rien n est configure', () => {
    const { service } = build();
    const previous = process.env.BILLING_GRACE_DAYS;
    delete process.env.BILLING_GRACE_DAYS;
    try {
      expect(service.graceDaysFor({})).toBe(7);
    } finally {
      if (previous !== undefined) process.env.BILLING_GRACE_DAYS = previous;
    }
  });

  it('refuse une duree de grace negative', () => {
    const { service } = build();
    expect(service.graceDaysFor({ graceDays: -5 })).toBe(0);
  });

  it('reactivate l abonnement quand la facture est soldee', async () => {
    const { service, subs, entitlements } = build({ status: SubscriptionStatus.GRACE_PERIOD });
    await service.onPaymentSucceeded('tenant-a', 'inv-1', 'pay-1', 'user-1');
    expect(subs.transition).toHaveBeenCalledWith(
      'sub-1',
      SubscriptionStatus.ACTIVE,
      'user-1',
      expect.objectContaining({ extra: expect.objectContaining({ graceEndsAt: null }) }),
    );
    expect(entitlements.invalidate).toHaveBeenCalledWith('tenant-a');
  });

  it('ne reactive rien si la facture n est pas soldee', async () => {
    const { service, prisma, subs } = build({ status: SubscriptionStatus.GRACE_PERIOD });
    prisma.invoice.findUnique = jest.fn(async () => ({ id: 'inv-1', subscriptionId: 'sub-1', status: InvoiceStatus.OPEN })) as any;
    await service.onPaymentSucceeded('tenant-a', 'inv-1', 'pay-1', 'user-1');
    expect(subs.transition).not.toHaveBeenCalled();
  });

  it('bascule en PAST_DUE puis en grace apres un echec de paiement', async () => {
    const { service, subs, audit, entitlements } = build({}, InvoiceStatus.OPEN);
    await service.onPaymentFailure('tenant-a', 'inv-1', 'pay-1', 'user-1');
    expect(subs.transition).toHaveBeenCalledWith('sub-1', SubscriptionStatus.PAST_DUE, 'user-1', expect.any(Object));
    expect(subs.suspend).not.toHaveBeenCalled();
    expect(audit.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'subscription.grace_started' }),
    );
    expect(entitlements.invalidate).toHaveBeenCalled();
  });

  it('suspend immediatement quand aucune grace n est configuree', async () => {
    const { service, subs } = build({ graceDays: 0 }, InvoiceStatus.OPEN);
    await service.onPaymentFailure('tenant-a', 'inv-1', 'pay-1', 'user-1');
    expect(subs.suspend).toHaveBeenCalled();
  });

  it('ne degrade pas un abonnement deja suspendu ou annule', async () => {
    const { service, subs } = build({ status: SubscriptionStatus.SUSPENDED });
    await service.onPaymentFailure('tenant-a', 'inv-1', 'pay-1', 'user-1');
    expect(subs.transition).not.toHaveBeenCalled();
  });

  it('trace l echec d une generation de facture au lieu de l ignorer', async () => {
    const { service, diagnostics } = build();
    (service as any).invoices.generateForSubscription = jest.fn(async () => {
      throw new Error('PRICE_NOT_FOUND');
    });
    await expect(service.generateInvoiceForCurrentPeriod('sub-1', 'tenant-a')).rejects.toMatchObject({
      code: BillingErrorCode.BILLING_CONFIGURATION_INVALID,
    });
    expect(diagnostics.record).toHaveBeenCalled();
  });

  it('ne consider pas une facture deja presente comme une erreur de sweep', async () => {
    const { service, diagnostics } = build();
    (service as any).invoices.generateForSubscription = jest.fn(async () => {
      throw billingError.conflict(
        BillingErrorCode.INVOICE_INVALID_STATE,
        'Une facture existe deja pour cette periode (TC-1)',
      );
    });
    await expect(service.generateInvoiceForCurrentPeriod('sub-1', 'tenant-a')).resolves.toBeNull();
    expect(diagnostics.record).not.toHaveBeenCalled();
  });
});
