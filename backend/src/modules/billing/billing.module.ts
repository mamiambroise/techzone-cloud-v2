import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingAuditService } from './common/billing-audit.service';
import { BillingCatalogService } from './catalog/billing-catalog.service';
import { BillingDiagnosticsService } from './diagnostics/billing-diagnostics.service';
import { EntitlementResolverService } from './entitlements/entitlement-resolver.service';
import { BillingSubscriptionService } from './subscription/billing-subscription.service';
import { BillingUsageService } from './usage/billing-usage.service';
import { BillingInvoiceNumberService } from './invoice/billing-invoice-number.service';
import { BillingInvoiceService } from './invoice/billing-invoice.service';
import { BillingLifecycleService } from './lifecycle/billing-lifecycle.service';
import { PaymentProviderRegistry } from './payment/payment-provider.interface';
import { BillingPaymentService } from './payment/billing-payment.service';
import { BillingWebhookService } from './webhook/billing-webhook.service';
import { BillingCatalogController } from './billing-catalog.controller';
import { BillingTenantController } from './billing-tenant.controller';
import { BillingAdminController } from './billing-admin.controller';
import { BillingWebhookController } from './webhook/billing-webhook.controller';
import { BillingSchedulerService } from './billing-scheduler.service';

/**
 * Module Billing (CDC 15 V2).
 *
 * Ce module remplace `IamBillingService` : il porte la logique metier
 * Subscription & Billing, expose des routes `/api/billing/*` et ne s'occupe
 * JAMAIS de l'authentification (IAM reste l'autorite, CDC 81).
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    BillingCatalogController,
    BillingTenantController,
    BillingAdminController,
    BillingWebhookController,
  ],
  providers: [
    BillingAuditService,
    BillingCatalogService,
    BillingDiagnosticsService,
    EntitlementResolverService,
    BillingSubscriptionService,
    BillingUsageService,
    BillingInvoiceNumberService,
    BillingInvoiceService,
    BillingLifecycleService,
    PaymentProviderRegistry,
    BillingPaymentService,
    BillingWebhookService,
    BillingSchedulerService,
  ],
  exports: [
    BillingAuditService,
    BillingCatalogService,
    BillingDiagnosticsService,
    EntitlementResolverService,
    BillingSubscriptionService,
    BillingUsageService,
    BillingInvoiceService,
    BillingLifecycleService,
    BillingPaymentService,
  ],
})
export class BillingModule {}