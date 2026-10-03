import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InvoiceStatus, PaymentMethod } from '../../generated/prisma/enums';
import { CurrentUser, hasAnyPermission } from '../../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../../iam/decorators/current-user.decorator';
import {
  BILLING_INVOICE_MANAGE,
  BILLING_INVOICE_READ,
  BILLING_OVERRIDE_MANAGE,
  BILLING_PAYMENT_READ,
  BILLING_PAYMENT_RECORD,
  BILLING_PAYMENT_REFUND,
  BILLING_READ,
  BILLING_SUBSCRIPTION_MANAGE,
  BILLING_USAGE_READ,
} from '../../iam/iam.constants';
import { BillingSubscriptionService } from './subscription/billing-subscription.service';
import { BillingInvoiceService } from './invoice/billing-invoice.service';
import { BillingPaymentService } from './payment/billing-payment.service';
import { BillingUsageService } from './usage/billing-usage.service';
import { EntitlementResolverService } from './entitlements/entitlement-resolver.service';
import { BillingDiagnosticsService } from './diagnostics/billing-diagnostics.service';
import { SUPPORTED_CURRENCIES } from './common/money';
import type {
  CancelSubscriptionInput,
  ChangePlanInput,
  CreateSubscriptionInput,
  RecordManualPaymentInput,
  RefundPaymentInput,
  UpsertBillingAccountInput,
  UpsertOverrideInput,
} from './billing.dto';

/**
 * Surface Billing d'un tenant (CDC 13/16/17/41/70/84).
 *
 * Regles appliquees ici, pas dans les services :
 *  - le `tenantId` provient TOUJOURS du principal IAM ; un `tenantId` fourni
 *    par le client qui ne correspond pas est rejete (RG-BILL-027) ;
 *  - chaque lecture passe par un service qui resout la portee ;
 *  - une ecriture exige la permission Billing correspondante, et une operation
 *    sensible comme la validation d'un paiement manuel exige sa permission
 *    propre (CDC 23/49), jamais celle de simple lecture.
 */
@ApiTags('billing')
@Controller('api/billing')
export class BillingTenantController {
  constructor(
    private readonly subs: BillingSubscriptionService,
    private readonly invoices: BillingInvoiceService,
    private readonly payments: BillingPaymentService,
    private readonly usage: BillingUsageService,
    private readonly entitlements: EntitlementResolverService,
    private readonly diagnostics: BillingDiagnosticsService,
  ) {}

  // -----------------------------------------------------------------------------------------
  // Contexte
  // -----------------------------------------------------------------------------------------

  @Get('context')
  @ApiOperation({ summary: 'Contexte Billing du tenant courant' })
  async context(@CurrentUser() ctx: IamAuthContext) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_READ);
    const [subscription, resolved] = await Promise.all([
      this.subs.currentForTenant(tenantId).catch(() => null),
      this.entitlements.resolve(tenantId).catch(() => null),
    ]);
    return {
      success: true,
      message: 'OK',
      data: {
        tenantId,
        subscription,
        entitlements: resolved,
        currencies: SUPPORTED_CURRENCIES,
        paymentMethods: [PaymentMethod.MANUAL],
        providers: this.payments.providersStatus(),
      },
    };
  }

  @Get('entitlements')
  @ApiOperation({ summary: 'Entitlements effectifs du tenant' })
  @ApiQuery({ name: 'refresh', required: false })
  async listEntitlements(@CurrentUser() ctx: IamAuthContext, @Query('refresh') refresh?: string) {
    const tenantId = this.requireTenant(ctx);
    const data = await this.entitlements.resolve(tenantId, { bypassCache: refresh === 'true' });
    return { success: true, message: 'OK', data };
  }

  @Get('entitlements/limits/:key')
  @ApiOperation({ summary: 'Lire une limite (avant ecriture)' })
  async entitlementLimit(@CurrentUser() ctx: IamAuthContext, @Param('key') key: string) {
    const tenantId = this.requireTenant(ctx);
    const resolved = await this.entitlements.resolve(tenantId);
    const entitlement = resolved.entitlements.find((item) => item.key === key);
    if (!entitlement) {
      return { success: true, message: 'OK', data: { key, allowed: false, reason: 'ENTITLEMENT_ABSENT' } };
    }
    return {
      success: true,
      message: 'OK',
      data: {
        key,
        allowed: entitlement.enabled && entitlement.status !== 'SUSPENDED',
        kind: entitlement.kind,
        limit: entitlement.limit,
        used: entitlement.used,
        remaining: entitlement.remaining,
        unit: entitlement.unit,
        enforcement: entitlement.enforcement,
        status: entitlement.status,
      },
    };
  }

  @Get('entitlements/:key')
  @ApiOperation({ summary: 'Verifier un entitlement (decision commerciale)' })
  async checkEntitlement(@CurrentUser() ctx: IamAuthContext, @Param('key') key: string) {
    const tenantId = this.requireTenant(ctx);
    const allowed = await this.entitlements.isEntitled(tenantId, key);
    return {
      success: true,
      message: 'OK',
      data: {
        key,
        allowed,
        note: "Une decision d'entitlement commercial ne remplace aucune permission IAM (CDC 81).",
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Billing (CDC 102)' })
  async health() {
    return { success: true, message: 'OK', data: await this.diagnostics.health() };
  }

  // -----------------------------------------------------------------------------------------
  // Abonnement
  // -----------------------------------------------------------------------------------------

  @Get('subscription')
  @ApiOperation({ summary: 'Abonnement du tenant' })
  async getSubscription(@CurrentUser() ctx: IamAuthContext) {
    const tenantId = this.requireTenant(ctx);
    return { success: true, message: 'OK', data: await this.subs.currentForTenant(tenantId) };
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Souscrire un plan' })
  async subscribe(@CurrentUser() ctx: IamAuthContext, @Body() body: CreateSubscriptionInput) {
    this.requirePermission(ctx, BILLING_SUBSCRIPTION_MANAGE);
    const tenantId = this.requireTenant(ctx);
    this.rejectForeignTenant(body.tenantId, tenantId);
    const data = await this.subs.create({ ...body, tenantId }, ctx.userId);
    return { success: true, message: 'Abonnement cree', data, statusCode: 201 };
  }

  @Post('subscription/activate')
  @ApiOperation({ summary: 'Activer l abonnement (DRAFT/TRIALING -> ACTIVE)' })
  async activateSubscription(
    @CurrentUser() ctx: IamAuthContext,
    @Body() body: { id?: string; period?: { start: string; end: string } },
  ) {
    this.requirePermission(ctx, BILLING_SUBSCRIPTION_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const subscriptionId = await this.resolveSubscriptionId(tenantId, body.id);
    const data = await this.subs.activate(
      subscriptionId,
      tenantId,
      ctx.userId,
      body.period ? { period: { start: new Date(body.period.start), end: new Date(body.period.end) } } : undefined,
    );
    return { success: true, message: 'Abonnement active', data };
  }

  @Post('subscription/change-plan')
  @ApiOperation({ summary: 'Changer de plan (upgrade / downgrade controle)' })
  async changePlan(@CurrentUser() ctx: IamAuthContext, @Body() body: ChangePlanInput) {
    this.requirePermission(ctx, BILLING_SUBSCRIPTION_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const subscriptionId = await this.resolveSubscriptionId(tenantId);
    const data = await this.subs.changePlan(subscriptionId, tenantId, ctx.userId, body);
    return { success: true, message: 'Plan mis a jour', data };
  }

  @Post('subscription/cancel')
  @ApiOperation({ summary: 'Annuler l abonnement' })
  async cancelSubscription(
    @CurrentUser() ctx: IamAuthContext,
    @Body() body: CancelSubscriptionInput,
  ) {
    this.requirePermission(ctx, BILLING_SUBSCRIPTION_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const subscriptionId = await this.resolveSubscriptionId(tenantId);
    const data = await this.subs.cancel(subscriptionId, tenantId, ctx.userId, body);
    return { success: true, message: 'Abonnement annule', data };
  }

  @Post('subscription/reactivate')
  @ApiOperation({ summary: 'Reactiver un abonnement suspendu' })
  async reactivateSubscription(
    @CurrentUser() ctx: IamAuthContext,
    @Body() body: { reason?: string },
  ) {
    this.requirePermission(ctx, BILLING_SUBSCRIPTION_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const subscriptionId = await this.resolveSubscriptionId(tenantId);
    const data = await this.subs.reactivate(subscriptionId, tenantId, ctx.userId, body.reason);
    return { success: true, message: 'Abonnement reactivate', data };
  }

  @Post('subscription/overrides')
  @ApiOperation({ summary: 'Override commercial (permission dediee)' })
  async upsertOverride(@CurrentUser() ctx: IamAuthContext, @Body() body: UpsertOverrideInput) {
    this.requirePermission(ctx, BILLING_OVERRIDE_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const subscriptionId = await this.resolveSubscriptionId(tenantId);
    const data = await this.subs.upsertOverride(subscriptionId, tenantId, ctx.userId, body);
    return { success: true, message: 'Override enregistre', data };
  }

  // -----------------------------------------------------------------------------------------
  // Compte de facturation
  // -----------------------------------------------------------------------------------------

  @Get('billing-account')
  @ApiOperation({ summary: 'Compte de facturation du tenant' })
  async getBillingAccount(@CurrentUser() ctx: IamAuthContext) {
    const tenantId = this.requireTenant(ctx);
    return { success: true, message: 'OK', data: await this.subs.getBillingAccount(tenantId) };
  }

  @Post('billing-account')
  @ApiOperation({ summary: 'Creer ou mettre a jour le compte de facturation' })
  async upsertBillingAccount(
    @CurrentUser() ctx: IamAuthContext,
    @Body() body: UpsertBillingAccountInput,
  ) {
    this.requirePermission(ctx, BILLING_INVOICE_MANAGE);
    const tenantId = this.requireTenant(ctx);
    const data = await this.subs.upsertBillingAccount(tenantId, body, ctx.userId);
    return { success: true, message: 'Compte de facturation enregistre', data };
  }

  // -----------------------------------------------------------------------------------------
  // Factures
  // -----------------------------------------------------------------------------------------

  @Get('invoices')
  @ApiOperation({ summary: 'Factures du tenant' })
  @ApiQuery({ name: 'status', required: false })
  async listInvoices(@CurrentUser() ctx: IamAuthContext, @Query('status') status?: string) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_INVOICE_READ);
    return {
      success: true,
      message: 'OK',
      data: await this.invoices.listForTenant(tenantId, {
        status: status ? (status as InvoiceStatus) : undefined,
      }),
    };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Detail d une facture du tenant' })
  async getInvoice(@CurrentUser() ctx: IamAuthContext, @Param('id') id: string) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_INVOICE_READ);
    return { success: true, message: 'OK', data: await this.invoices.getScoped(id, tenantId) };
  }

  // -----------------------------------------------------------------------------------------
  // Paiements
  // -----------------------------------------------------------------------------------------

  @Get('payments')
  @ApiOperation({ summary: 'Paiements du tenant' })
  async listPayments(@CurrentUser() ctx: IamAuthContext) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_PAYMENT_READ);
    return { success: true, message: 'OK', data: await this.payments.listForTenant(tenantId) };
  }

  /**
   * CDC 49 : l'enregistrement d'un paiement manuel exige `billing:payment:record`.
   * Elle n'est PAS accordee par defaut au role tenant : lecture ne vaut pas
   * ecriture comptable.
   */
  @Post('payments/manual')
  @ApiOperation({ summary: 'Enregistrer un paiement manuel (permission dediee)' })
  async recordManualPayment(
    @CurrentUser() ctx: IamAuthContext,
    @Body() body: RecordManualPaymentInput,
  ) {
    this.requirePermission(ctx, BILLING_PAYMENT_RECORD);
    const tenantId = this.requireTenant(ctx);
    const result = await this.payments.recordManualPayment(tenantId, ctx.userId, body);
    return {
      success: true,
      message: result.duplicate ? 'Paiement deja enregistre (idempotence)' : 'Paiement enregistre',
      data: result.payment,
    };
  }

  @Post('payments/:id/validate')
  @ApiOperation({ summary: 'Valider un paiement manuel (permission dediee)' })
  async validatePayment(
    @CurrentUser() ctx: IamAuthContext,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    this.requirePermission(ctx, BILLING_PAYMENT_RECORD);
    const tenantId = this.requireTenant(ctx);
    const data = await this.payments.validateManualPayment(id, tenantId, ctx.userId, body.reason);
    return { success: true, message: 'Paiement valide', data };
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Rembourser un paiement (permission dediee)' })
  async refundPayment(
    @CurrentUser() ctx: IamAuthContext,
    @Param('id') id: string,
    @Body() body: RefundPaymentInput,
  ) {
    this.requirePermission(ctx, BILLING_PAYMENT_REFUND);
    const tenantId = this.requireTenant(ctx);
    const data = await this.payments.refund(id, tenantId, ctx.userId, body);
    return { success: true, message: 'Remboursement enregistre', data };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Moyens de paiement reellement supportes' })
  listProviders() {
    return {
      success: true,
      message: 'OK',
      data: {
        ...this.payments.providersStatus(),
        // CDC 43/44 : seul le Manuel est reellement disponible en MVP.
        supportedMethods: [PaymentMethod.MANUAL],
      },
    };
  }

  // -----------------------------------------------------------------------------------------
  // Consommation
  // -----------------------------------------------------------------------------------------

  @Get('usage')
  @ApiOperation({ summary: 'Resume de consommation du tenant' })
  async usageSummary(@CurrentUser() ctx: IamAuthContext) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_USAGE_READ);
    return { success: true, message: 'OK', data: await this.usage.summary(tenantId) };
  }

  @Get('usage/events')
  @ApiOperation({ summary: 'Evenements de consommation du tenant' })
  @ApiQuery({ name: 'meterKey', required: false })
  async usageEvents(@CurrentUser() ctx: IamAuthContext, @Query('meterKey') meterKey?: string) {
    const tenantId = this.requireTenant(ctx);
    this.requirePermission(ctx, BILLING_USAGE_READ);
    return { success: true, message: 'OK', data: await this.usage.listEvents(tenantId, { meterKey }) };
  }

  // -----------------------------------------------------------------------------------------
  // Garde-fous
  // -----------------------------------------------------------------------------------------

  private requireTenant(ctx: IamAuthContext): string {
    if (!ctx.tenantId) {
      throw new ForbiddenException(
        'Aucune organisation active dans cette session : le contexte Billing est indefini.',
      );
    }
    return ctx.tenantId;
  }

  private requirePermission(ctx: IamAuthContext, permission: string): void {
    if (!hasAnyPermission(ctx, [permission])) {
      throw new ForbiddenException(`Permission Billing requise : ${permission}`);
    }
  }

  /** RG-BILL-027 : un tenantId different de celui du principal est refuse. */
  private rejectForeignTenant(bodyTenantId: string | undefined, tenantId: string): void {
    if (bodyTenantId && bodyTenantId !== tenantId) {
      throw new BadRequestException(
        'Le tenantId du corps de requete ne correspond pas au tenant de la session.',
      );
    }
  }

  private async resolveSubscriptionId(tenantId: string, explicitId?: string): Promise<string> {
    if (explicitId) {
      await this.subs.getScoped(explicitId, tenantId);
      return explicitId;
    }
    const subscription = await this.subs.currentForTenant(tenantId);
    if (!subscription) {
      throw new BadRequestException('Aucun abonnement pour le tenant courant.');
    }
    return subscription.id;
  }
}