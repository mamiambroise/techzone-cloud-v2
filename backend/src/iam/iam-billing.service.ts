import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IamError } from './iam-error';

@Injectable()
export class IamBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status as any;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.plan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { entitlements: true },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { entitlements: true, subscriptions: true } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }
    return plan;
  }

  async createPlan(body: { code: string; name: string; description?: string; billingInterval?: string; price?: number; currency?: string; features?: Array<{ code: string; allocation?: number; metadata?: Record<string, unknown> }> }) {
    const existing = await this.prisma.plan.findUnique({ where: { code: body.code } });
    if (existing) {
      throw new IamError('Code de plan déjà utilisé', 409, 'PLAN_CODE_TAKEN');
    }

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          code: body.code,
          name: body.name,
          description: body.description ?? null,
          billingInterval: (body.billingInterval ?? 'MONTHLY') as any,
          price: body.price ?? 0,
          currency: body.currency ?? 'EUR',
          status: 'DRAFT' as any,
          metadata: body.features ? JSON.stringify(body.features) : undefined,
        },
      });

      if (body.features && body.features.length > 0) {
        for (const f of body.features) {
          await tx.planEntitlement.create({
            data: {
              planId: plan.id,
              featureCode: f.code,
              valueType: 'INTEGER' as any,
              enabled: true,
              integerValue: f.allocation ?? null,
              metadata: f.metadata as any,
            },
          });
        }
      }

      return plan;
    });
  }

  async updatePlan(id: string, body: Record<string, unknown>) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }

    const data: any = { updatedAt: new Date() };
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.billingInterval !== undefined) data.billingInterval = body.billingInterval;
    if (body.price !== undefined) data.price = body.price;
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.metadata !== undefined) data.metadata = body.metadata;

    return this.prisma.plan.update({ where: { id }, data });
  }

  async activatePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }
    return this.prisma.plan.update({
      where: { id },
      data: { status: 'ACTIVE' as any, version: { increment: 1 } },
    });
  }

  async deprecatePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }
    return this.prisma.plan.update({
      where: { id },
      data: { status: 'DEPRECATED' as any, version: { increment: 1 }, archivedAt: new Date() },
    });
  }

  async archivePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }
    return this.prisma.plan.update({
      where: { id },
      data: { status: 'ARCHIVED' as any, version: { increment: 1 }, archivedAt: new Date() },
    });
  }

  async newPlanVersion(id: string, body: { name?: string; description?: string; price?: any; metadata?: Record<string, unknown> }) {
    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { entitlements: true } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }

    return this.prisma.$transaction(async (tx) => {
      const newVersion = await tx.plan.create({
        data: {
          code: plan.code,
          name: body.name ?? plan.name,
          description: body.description ?? plan.description,
          billingInterval: plan.billingInterval,
          price: body.price ?? plan.price,
          currency: plan.currency,
          status: 'DRAFT' as any,
          version: plan.version + 1,
          metadata: body.metadata as any,
        },
      });

      if (plan.entitlements && plan.entitlements.length > 0) {
        for (const e of plan.entitlements) {
          await tx.planEntitlement.create({
            data: {
              planId: newVersion.id,
              featureCode: e.featureCode,
              valueType: e.valueType,
              enabled: e.enabled,
              integerValue: e.integerValue,
              metadata: e.metadata as any,
            },
          });
        }
      }

      return newVersion;
    });
  }

  async addPlanEntitlement(id: string, body: { featureCode: string; allocation?: number; metadata?: Record<string, unknown> }) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }

    return this.prisma.planEntitlement.create({
      data: {
        planId: id,
        featureCode: body.featureCode,
        valueType: body.allocation !== undefined && typeof body.allocation === 'number' ? 'INTEGER' : 'BOOLEAN',
        enabled: true,
        integerValue: body.allocation ?? null,
        booleanValue: body.allocation === undefined,
        metadata: body.metadata as any,
      },
    });
  }

  async removePlanEntitlement(planId: string, entitlementId: string) {
    await this.prisma.planEntitlement.delete({ where: { id: entitlementId } });
  }

  async listSubscriptions(params?: { status?: string; tenantId?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status as any;
    if (params?.tenantId) where.tenantId = params.tenantId;

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { plan: true, tenant: { select: { id: true, code: true, name: true } } },
    });
  }

  async getSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, tenant: true, invoices: true },
    });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return subscription;
  }

  async createSubscription(body: { tenantId: string; planId: string; status?: string; startsAt?: string; expiresAt?: string; cancelAtPeriodEnd?: boolean }) {
    const plan = await this.prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: body.tenantId } });
    if (!tenant) {
      throw new IamError('Tenant introuvable', 404, 'TENANT_NOT_FOUND');
    }

    return this.prisma.subscription.create({
      data: {
        tenantId: body.tenantId,
        planId: body.planId,
        status: (body.status ?? 'ACTIVE') as any,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
  }

  async activateSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE' as any },
    });
  }

  async changeSubscriptionPlan(id: string, body: { planId: string; effectiveAt?: string }) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    const plan = await this.prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) {
      throw new IamError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: { planId: body.planId },
    });
  }

  async suspendSubscription(id: string, body?: { reason?: string }) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'SUSPENDED' as any, suspendedAt: new Date() },
    });
  }

  async resumeSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE' as any },
    });
  }

  async cancelSubscription(id: string, body?: { reason?: string }) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELED' as any,
        canceledAt: new Date(),
        cancelReason: body?.reason ?? null,
        cancellationReason: body?.reason ?? null,
      },
    });
  }

  async renewSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }
    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE' as any },
    });
  }

  async listInvoices(params?: { status?: string; tenantId?: string; subscriptionId?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status as any;
    if (params?.tenantId) where.tenantId = params.tenantId;
    if (params?.subscriptionId) where.subscriptionId = params.subscriptionId;

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { subscription: true, tenant: true },
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { subscription: true, tenant: true, items: true, payments: true },
    });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }
    return invoice;
  }

  async generateInvoice(body: { tenantId: string; subscriptionId: string; items?: Array<{ description: string; amount: number; quantity?: number }> }) {
    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const items: Array<{ description: string; amount: number; quantity?: number }> = body.items ?? [];
      for (const item of items) {
        total += item.amount * (item.quantity ?? 1);
      }

      const invoiceNumber = `INV-${Date.now()}`;
      const invoice = await tx.invoice.create({
        data: {
          tenantId: body.tenantId,
          subscriptionId: body.subscriptionId,
          invoiceNumber,
          status: 'DRAFT' as any,
          currency: 'EUR',
          total,
          amountDue: total,
          metadata: items.length > 0 ? JSON.stringify(items) : undefined,
        },
      });

      if (items.length > 0) {
        for (const item of items) {
          const lineTotal = item.amount * (item.quantity ?? 1);
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity ?? 1,
              unitPrice: item.amount,
              subtotal: item.amount * (item.quantity ?? 1),
              total: lineTotal,
            },
          });
        }
      }

      return invoice;
    });
  }

  async issueInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED' as any, issuedAt: new Date(), dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  }

  async applyPaymentToInvoice(id: string, body: { amount: number; method?: string }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount: body.amount,
          currency: invoice.currency,
          provider: body.method ?? 'MANUAL',
          paymentMethod: body.method ?? 'MANUAL',
          status: 'SUCCEEDED' as any,
          completedAt: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id },
        data: {
          status: 'PAID' as any,
          amountPaid: { increment: body.amount },
          paidAt: new Date(),
        },
      });

      return { payment, invoice: await tx.invoice.findUnique({ where: { id } }) };
    });
  }

  async markInvoiceOverdue(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'OVERDUE' as any },
    });
  }

  async voidInvoice(id: string, body?: { reason?: string }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'VOID' as any },
    });
  }

  async listPayments(params?: { status?: string; tenantId?: string; invoiceId?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status as any;
    if (params?.invoiceId) where.invoiceId = params.invoiceId;

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.payment.findMany({
      where,
      skip,
      take,
      orderBy: { initiatedAt: 'desc' },
      include: { invoice: true },
    });
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });
    if (!payment) {
      throw new IamError('Payment introuvable', 404, 'PAYMENT_NOT_FOUND');
    }
    return payment;
  }

  async paymentsForInvoice(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { initiatedAt: 'desc' },
    });
  }

  async initiatePayment(body: { invoiceId: string; amount: number; method?: string; currency?: string }) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: body.invoiceId } });
    if (!invoice) {
      throw new IamError('Invoice introuvable', 404, 'INVOICE_NOT_FOUND');
    }

    return this.prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        currency: body.currency ?? invoice.currency,
        provider: body.method ?? 'MANUAL',
        paymentMethod: body.method ?? 'MANUAL',
        status: 'PENDING' as any,
      },
    });
  }

  async markPaymentProcessing(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new IamError('Payment introuvable', 404, 'PAYMENT_NOT_FOUND');
    }
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'PROCESSING' as any },
    });
  }

  async markPaymentSucceeded(id: string, body?: { transactionId?: string }) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { invoice: true } });
    if (!payment) {
      throw new IamError('Payment introuvable', 404, 'PAYMENT_NOT_FOUND');
    }

    const data: any = { status: 'SUCCEEDED' as any, completedAt: new Date() };
    if (body?.transactionId) data.externalReference = body.transactionId;

    const updated = await this.prisma.payment.update({
      where: { id },
      data,
    });

    if (payment.invoice && payment.invoice.status !== 'PAID') {
      await this.prisma.invoice.update({
        where: { id: payment.invoiceId! },
        data: { status: 'PAID' as any, amountPaid: { increment: Number(payment.amount) }, paidAt: new Date() },
      });
    }

    return updated;
  }

  async markPaymentFailed(id: string, body?: { reason?: string }) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new IamError('Payment introuvable', 404, 'PAYMENT_NOT_FOUND');
    }
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'FAILED' as any, failedAt: new Date(), failureMessage: body?.reason ?? null },
    });
  }

  async refundPayment(id: string, body?: { amount?: number; reason?: string }) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { invoice: true } });
    if (!payment) {
      throw new IamError('Payment introuvable', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'SUCCEEDED') {
      throw new IamError('Seuls les paiements réussis peuvent être remboursés', 400, 'PAYMENT_CANNOT_REFUND');
    }

    const refundAmount = body?.amount ?? Number(payment.amount);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: 'REFUNDED' as any,
          refundedAt: new Date(),
          refundAmount,
          refundReason: body?.reason ?? null,
        },
      });

      if (payment.invoice && payment.invoice.status === 'PAID') {
        await tx.invoice.update({
          where: { id: payment.invoiceId! },
          data: { status: 'REFUNDED' as any, paidAt: null },
        });
      }

      return updated;
    });
  }

  async getEntitlements(subscriptionId: string) {
    return this.prisma.subscriptionEntitlementOverride.findMany({
      where: { subscriptionId },
    });
  }

  async getEntitlement(subscriptionId: string, featureCode: string) {
    const entitlement = await this.prisma.subscriptionEntitlementOverride.findFirst({
      where: { subscriptionId, featureCode },
    });
    if (!entitlement) {
      throw new IamError('Entitlement introuvable', 404, 'ENTITLEMENT_NOT_FOUND');
    }
    return entitlement;
  }

  async createEntitlementOverride(subscriptionId: string, featureCode: string, body: { allocation?: number; metadata?: Record<string, unknown> }) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new IamError('Subscription introuvable', 404, 'SUBSCRIPTION_NOT_FOUND');
    }

    const existing = await this.prisma.subscriptionEntitlementOverride.findFirst({
      where: { subscriptionId, featureCode },
    });

    if (existing) {
      return this.prisma.subscriptionEntitlementOverride.update({
        where: { id: existing.id },
        data: {
          enabled: true,
          integerValue: body.allocation ?? null,
          metadata: body.metadata as any,
        },
      });
    }

    return this.prisma.subscriptionEntitlementOverride.create({
      data: {
        subscriptionId,
        featureCode,
        valueType: body.allocation !== undefined ? 'INTEGER' : 'BOOLEAN',
        enabled: true,
        integerValue: body.allocation ?? null,
        booleanValue: body.allocation === undefined,
        metadata: body.metadata as any,
      },
    });
  }

  async removeEntitlementOverride(subscriptionId: string, featureCode: string) {
    const entitlement = await this.prisma.subscriptionEntitlementOverride.findFirst({
      where: { subscriptionId, featureCode },
    });
    if (!entitlement) {
      return { success: true, message: 'Aucun override à retirer' };
    }

    await this.prisma.subscriptionEntitlementOverride.update({
      where: { id: entitlement.id },
      data: { enabled: false },
    });

    return { success: true, message: 'Override retiré' };
  }

  async getEntitlementQuota(subscriptionId: string, featureCode: string) {
    const entitlement = await this.prisma.subscriptionEntitlementOverride.findFirst({
      where: { subscriptionId, featureCode },
    });

    const quota = await this.prisma.quotaUsage.findFirst({
      where: { subscriptionId, featureCode },
    });

    return { entitlement: entitlement ?? null, quota: quota ?? null };
  }

  async consumeEntitlementQuota(subscriptionId: string, featureCode: string, body: { amount?: number }) {
    const entitlement = await this.prisma.subscriptionEntitlementOverride.findFirst({
      where: { subscriptionId, featureCode },
    });
    if (!entitlement) {
      throw new IamError('Entitlement introuvable', 404, 'ENTITLEMENT_NOT_FOUND');
    }

    const allocation = entitlement.integerValue;
    if (allocation !== null && allocation !== undefined && body.amount) {
      const quota = await this.prisma.quotaUsage.findFirst({
        where: { subscriptionId, featureCode },
      });

      const consumed = (quota?.usedValue ? Number(quota.usedValue) : 0) + body.amount;

      if (consumed > Number(allocation)) {
        throw new IamError('Quota d entitlement épuisé', 403, 'ENTITLEMENT_QUOTA_EXHAUSTED');
      }

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (quota) {
        await this.prisma.quotaUsage.update({
          where: { id: quota.id },
          data: { usedValue: consumed, updatedAt: now },
        });
      } else {
        await this.prisma.quotaUsage.create({
          data: {
            subscriptionId,
            featureCode,
            periodStart,
            periodEnd,
            usedValue: consumed,
            limitValue: Number(allocation),
            updatedAt: now,
          },
        });
      }
    }

    return { success: true, consumed: body.amount ?? 1 };
  }

  async listFeatures(params?: { status?: string; search?: string; type?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.type) where.type = params.type;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;

    return this.prisma.feature.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async getFeature(code: string) {
    const feature = await this.prisma.feature.findUnique({ where: { code } });
    if (!feature) {
      throw new IamError('Feature introuvable', 404, 'FEATURE_NOT_FOUND');
    }
    return feature;
  }

  async createFeature(body: { code: string; name: string; description?: string; type?: string; unit?: string; metadata?: Record<string, unknown> }) {
    const existing = await this.prisma.feature.findUnique({ where: { code: body.code } });
    if (existing) {
      throw new IamError('Code de feature déjà utilisé', 409, 'FEATURE_CODE_TAKEN');
    }
    return this.prisma.feature.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description ?? null,
        status: 'ACTIVE' as any,
        metadata: body.metadata as any,
      },
    });
  }

  async updateFeature(code: string, body: Partial<{ name: string; description: string; type: string; unit: string; status: string; metadata: Record<string, unknown> }>) {
    const feature = await this.prisma.feature.findUnique({ where: { code } });
    if (!feature) {
      throw new IamError('Feature introuvable', 404, 'FEATURE_NOT_FOUND');
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.status !== undefined) data.status = body.status;
    if (body.metadata !== undefined) data.metadata = body.metadata;

    return this.prisma.feature.update({ where: { code }, data });
  }

  async deprecateFeature(code: string) {
    const feature = await this.prisma.feature.findUnique({ where: { code } });
    if (!feature) {
      throw new IamError('Feature introuvable', 404, 'FEATURE_NOT_FOUND');
    }
    return this.prisma.feature.update({
      where: { code },
      data: { status: 'DEPRECATED' as any },
    });
  }

  async checkAccess(body: { featureCode: string; tenantId: string; subscriptionId?: string; amount?: number }) {
    if (body.subscriptionId) {
      const entitlement = await this.prisma.subscriptionEntitlementOverride.findFirst({
        where: { subscriptionId: body.subscriptionId, featureCode: body.featureCode },
      });

      if (!entitlement) {
        return { allowed: false, reason: 'ENTITLEMENT_NOT_FOUND' };
      }

      if (entitlement.integerValue !== null && entitlement.integerValue !== undefined && body.amount) {
        const quota = await this.prisma.quotaUsage.findFirst({
          where: { subscriptionId: body.subscriptionId, featureCode: body.featureCode },
        });
        const consumed = quota?.usedValue ? Number(quota.usedValue) : 0;
        if (consumed + body.amount > Number(entitlement.integerValue)) {
          return { allowed: false, reason: 'QUOTA_EXHAUSTED' };
        }
      }

      return { allowed: true, entitlement };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId: body.tenantId, status: 'ACTIVE' },
      include: { plan: { include: { entitlements: true } } },
    });

    if (!subscription) {
      return { allowed: false, reason: 'NO_ACTIVE_SUBSCRIPTION' };
    }

    const entitlement = (subscription.plan.entitlements ?? []).find(
      (e: { featureCode: string }) => e.featureCode === body.featureCode,
    );

    if (!entitlement) {
      const override = await this.prisma.subscriptionEntitlementOverride.findFirst({
        where: { subscriptionId: subscription.id, featureCode: body.featureCode },
      });

      if (!override || !override.enabled) {
        return { allowed: false, reason: 'ENTITLEMENT_NOT_FOUND' };
      }
      return { allowed: true, entitlement: override };
    }

    if (entitlement.integerValue !== null && entitlement.integerValue !== undefined && body.amount) {
      const quota = await this.prisma.quotaUsage.findFirst({
        where: { subscriptionId: subscription.id, featureCode: body.featureCode },
      });
      const consumed = quota?.usedValue ? Number(quota.usedValue) : 0;
      if (consumed + body.amount > Number(entitlement.integerValue)) {
        return { allowed: false, reason: 'QUOTA_EXHAUSTED' };
      }
    }

    return { allowed: true, entitlement };
  }
}
