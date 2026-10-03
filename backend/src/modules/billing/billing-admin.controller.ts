import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  BillingStage,
  BillingDiagnosticStatus,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '../../generated/prisma/enums';
import { IamAdminGuard } from '../../iam/iam-admin-guard';
import { Permissions } from '../../iam/iam-permissions.guard';
import {
  BILLING_DIAGNOSTIC_READ,
  BILLING_INVOICE_MANAGE,
  BILLING_INVOICE_READ,
  BILLING_MANAGE,
  BILLING_PAYMENT_READ,
  BILLING_PAYMENT_RECORD,
  BILLING_PAYMENT_REFUND,
  BILLING_READ,
  BILLING_SUBSCRIPTION_READ,
  BILLING_USAGE_READ,
} from '../../iam/iam.constants';
import { BillingSubscriptionService } from './subscription/billing-subscription.service';
import { BillingInvoiceService } from './invoice/billing-invoice.service';
import { BillingPaymentService } from './payment/billing-payment.service';
import { BillingUsageService } from './usage/billing-usage.service';
import { BillingLifecycleService } from './lifecycle/billing-lifecycle.service';
import { BillingDiagnosticsService } from './diagnostics/billing-diagnostics.service';
import { BillingWebhookService } from './webhook/billing-webhook.service';
import type {
  AdjustInvoiceInput,
  MarkPaymentFailedInput,
  RecordManualPaymentInput,
  RefundPaymentInput,
} from './billing.dto';

/**
 * Console d'administration Billing (CDC 70/71/72).
 *
 * L'administration plateforme est cross-tenant PAR CONSTRUCTION : c'est le
 * seul endroit ou un operateur lit plusieurs tenants, et chaque operation reste
 * tracee. Aucune suppression n'est exposee : CDC 16 interdit la suppression de
 * donnees metier.
 */
@ApiTags('billing-admin')
@Controller('api/billing/admin')
@UseGuards(IamAdminGuard)
export class BillingAdminController {
  constructor(
    private readonly subs: BillingSubscriptionService,
    private readonly invoices: BillingInvoiceService,
    private readonly payments: BillingPaymentService,
    private readonly usage: BillingUsageService,
    private readonly lifecycle: BillingLifecycleService,
    private readonly diagnostics: BillingDiagnosticsService,
    private readonly webhooks: BillingWebhookService,
  ) {}

  @Get('subscriptions')
  @Permissions(BILLING_SUBSCRIPTION_READ)
  @ApiOperation({ summary: 'Abonnements (cross-tenant)' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listSubscriptions(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      message: 'OK',
      data: await this.subs.listAll({
        tenantId,
        status: status as SubscriptionStatus | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    };
  }

  @Get('invoices')
  @Permissions(BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'Factures (cross-tenant)' })
  async listInvoices(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      message: 'OK',
      data: await this.invoices.listAll({
        tenantId,
        status: status as InvoiceStatus | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    };
  }

  @Get('invoices/:id')
  @Permissions(BILLING_INVOICE_READ)
  @ApiOperation({ summary: 'Detail d une facture (cross-tenant)' })
  async getInvoice(@Param('id') id: string) {
    return { success: true, message: 'OK', data: await this.invoices.getScoped(id, null) };
  }

  @Post('invoices/generate')
  @Permissions(BILLING_INVOICE_MANAGE)
  @ApiOperation({ summary: 'Generer la facture de la periode courante' })
  async generateInvoice(
    @Body() body: { subscriptionId: string; tenantId: string; dueDays?: number },
  ) {
    const data = await this.invoices.generateForSubscription(
      body.subscriptionId,
      body.tenantId,
      'admin:billing',
      body.dueDays !== undefined ? { dueDays: body.dueDays } : undefined,
    );
    return { success: true, message: 'Facture generee', data, statusCode: 201 };
  }

  @Post('invoices/:id/issue')
  @Permissions(BILLING_INVOICE_MANAGE)
  @ApiOperation({ summary: 'Emettre une facture' })
  async issueInvoice(@Param('id') id: string, @Body() body: { dueDays?: number }) {
    const data = await this.invoices.issue(id, null, 'admin:billing', body.dueDays);
    return { success: true, message: 'Facture emise', data };
  }

  @Post('invoices/:id/overdue')
  @Permissions(BILLING_INVOICE_MANAGE)
  @ApiOperation({ summary: 'Marquer une facture en retard' })
  async markInvoiceOverdue(@Param('id') id: string) {
    const data = await this.invoices.markOverdue(id, null, 'admin:billing');
    return { success: true, message: 'Facture en retard', data };
  }

  @Post('invoices/:id/void')
  @Permissions(BILLING_INVOICE_MANAGE)
  @ApiOperation({ summary: 'Annuler une facture (motif obligatoire)' })
  async voidInvoice(@Param('id') id: string, @Body() body: { reason: string }) {
    const data = await this.invoices.voidInvoice(id, null, 'admin:billing', body.reason);
    return { success: true, message: 'Facture annulee', data };
  }

  @Post('invoices/:id/adjustments')
  @Permissions(BILLING_INVOICE_MANAGE)
  @ApiOperation({ summary: 'Ajustement commercial trace' })
  async adjustInvoice(@Param('id') id: string, @Body() body: AdjustInvoiceInput) {
    const data = await this.invoices.adjust(id, null, 'admin:billing', body);
    return { success: true, message: 'Ajustement enregistre', data, statusCode: 201 };
  }

  @Get('payments')
  @Permissions(BILLING_PAYMENT_READ)
  @ApiOperation({ summary: 'Paiements (cross-tenant)' })
  async listPayments(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      message: 'OK',
      data: await this.payments.listAll({
        tenantId,
        status: status as PaymentStatus | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    };
  }

  @Post('payments/manual')
  @Permissions(BILLING_PAYMENT_RECORD)
  @ApiOperation({ summary: 'Enregistrer un paiement manuel pour un tenant' })
  async recordPayment(
    @Body() body: RecordManualPaymentInput & { tenantId: string },
  ) {
    const { tenantId, ...rest } = body;
    const result = await this.payments.recordManualPayment(tenantId, 'admin:billing', rest);
    return {
      success: true,
      message: result.duplicate ? 'Paiement deja enregistre (idempotence)' : 'Paiement enregistre',
      data: result.payment,
    };
  }

  @Post('payments/:id/fail')
  @Permissions(BILLING_PAYMENT_RECORD)
  @ApiOperation({ summary: 'Marquer un paiement en echec' })
  async failPayment(@Param('id') id: string, @Body() body: MarkPaymentFailedInput) {
    const data = await this.payments.markFailed(id, null, 'admin:billing', body);
    return { success: true, message: 'Paiement en echec', data };
  }

  @Post('payments/:id/refund')
  @Permissions(BILLING_PAYMENT_REFUND)
  @ApiOperation({ summary: 'Rembourser un paiement' })
  async refundPayment(@Param('id') id: string, @Body() body: RefundPaymentInput) {
    const data = await this.payments.refund(id, null, 'admin:billing', body);
    return { success: true, message: 'Remboursement enregistre', data };
  }

  @Get('usage/events')
  @Permissions(BILLING_USAGE_READ)
  @ApiOperation({ summary: 'Evenements de consommation (cross-tenant)' })
  async usageEvents(@Query('tenantId') tenantId?: string, @Query('meterKey') meterKey?: string) {
    return { success: true, message: 'OK', data: await this.usage.listEventsAll({ tenantId, meterKey }) };
  }

  @Get('diagnostics')
  @Permissions(BILLING_DIAGNOSTIC_READ)
  @ApiOperation({ summary: 'Diagnostics Billing (CDC 101)' })
  async listDiagnostics(
    @Query('stage') stage?: string,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      message: 'OK',
      data: await this.diagnostics.list({
        stage: stage as BillingStage | undefined,
        status: status as BillingDiagnosticStatus | undefined,
        tenantId,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    };
  }

  @Get('webhooks')
  @Permissions(BILLING_DIAGNOSTIC_READ)
  @ApiOperation({ summary: 'Webhooks recus (payloads expurges)' })
  async listWebhooks(@Query('provider') provider?: string) {
    return { success: true, message: 'OK', data: await this.webhooks.listEvents({ provider }) };
  }

  @Get('health')
  @Permissions(BILLING_READ)
  @ApiOperation({ summary: 'Health Billing detaille (CDC 102)' })
  async health() {
    return { success: true, message: 'OK', data: await this.diagnostics.health() };
  }

  /**
   * Declenchement manuel des sweeps. Reserve `billing:manage` : le scheduler
   * reste optionnel, un operateur peut aussi lancer la sequence a la demande.
   */
  @Post('sweeps')
  @Permissions(BILLING_MANAGE)
  @ApiOperation({ summary: 'Executer les sweeps Billing (renouvellement, grace, echeances)' })
  async runSweeps() {
    return { success: true, message: 'Sweeps Billing executes', data: await this.lifecycle.runAllSweeps() };
  }
}