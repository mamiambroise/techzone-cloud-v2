import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IamBillingService } from './iam-billing.service';
import { IamAdminGuard } from './iam-admin-guard';
import { Permissions } from './iam-permissions.guard';
import { IAM_ADMIN } from './iam.constants';

@ApiTags('iam-billing')
@Permissions(IAM_ADMIN)
@UseGuards(IamAdminGuard)
@Controller('api/iam/billing')
export class IamBillingController {
  constructor(private readonly billingService: IamBillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Liste des plans de billing (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async plans(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.billingService.listPlans({ status, search, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Post('plans')
  @ApiOperation({ summary: 'Créer un plan de billing (admin)' })
  async createPlan(@Body() body: any) {
    const data = await this.billingService.createPlan(body);
    return { success: true, message: 'Plan créé', data, statusCode: 201 };
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Détail d un plan (admin)' })
  async getPlan(@Param('id') id: string) {
    const data = await this.billingService.getPlan(id);
    return { success: true, message: 'OK', data };
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Mettre à jour un plan (admin)' })
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.updatePlan(id, body);
    return { success: true, message: 'Plan mis à jour', data };
  }

  @Post('plans/:id/activate')
  @ApiOperation({ summary: 'Activer un plan (admin)' })
  async activatePlan(@Param('id') id: string) {
    const data = await this.billingService.activatePlan(id);
    return { success: true, message: 'Plan activé', data };
  }

  @Post('plans/:id/deprecate')
  @ApiOperation({ summary: 'Déprécier un plan (admin)' })
  async deprecatePlan(@Param('id') id: string) {
    const data = await this.billingService.deprecatePlan(id);
    return { success: true, message: 'Plan déprécié', data };
  }

  @Post('plans/:id/archive')
  @ApiOperation({ summary: 'Archiver un plan (admin)' })
  async archivePlan(@Param('id') id: string) {
    const data = await this.billingService.archivePlan(id);
    return { success: true, message: 'Plan archivé', data };
  }

  @Post('plans/:id/new-version')
  @ApiOperation({ summary: 'Nouvelle version d un plan (admin)' })
  async newPlanVersion(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.newPlanVersion(id, body);
    return { success: true, message: 'Nouvelle version créée', data, statusCode: 201 };
  }

  @Post('plans/:id/entitlements')
  @ApiOperation({ summary: 'Ajouter une entitlement à un plan (admin)' })
  async addPlanEntitlement(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.addPlanEntitlement(id, body);
    return { success: true, message: 'Entitlement ajoutée', data };
  }

  @Delete('plans/:planId/entitlements/:entitlementId')
  @ApiOperation({ summary: 'Retirer une entitlement d un plan (admin)' })
  async removePlanEntitlement(@Param('planId') planId: string, @Param('entitlementId') entitlementId: string) {
    await this.billingService.removePlanEntitlement(planId, entitlementId);
    return { success: true, message: 'Entitlement retirée' };
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Liste des subscriptions (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async subscriptions(
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.billingService.listSubscriptions({ status, tenantId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Créer une subscription (admin)' })
  async createSubscription(@Body() body: any) {
    const data = await this.billingService.createSubscription(body);
    return { success: true, message: 'Subscription créée', data, statusCode: 201 };
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Détail d une subscription (admin)' })
  async getSubscription(@Param('id') id: string) {
    const data = await this.billingService.getSubscription(id);
    return { success: true, message: 'OK', data };
  }

  @Post('subscriptions/:id/activate')
  @ApiOperation({ summary: 'Activer une subscription (admin)' })
  async activateSubscription(@Param('id') id: string) {
    const data = await this.billingService.activateSubscription(id);
    return { success: true, message: 'Subscription activée', data };
  }

  @Post('subscriptions/:id/change-plan')
  @ApiOperation({ summary: 'Changer de plan d une subscription (admin)' })
  async changeSubscriptionPlan(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.changeSubscriptionPlan(id, body);
    return { success: true, message: 'Plan changé', data };
  }

  @Post('subscriptions/:id/suspend')
  @ApiOperation({ summary: 'Suspendre une subscription (admin)' })
  async suspendSubscription(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.suspendSubscription(id, body);
    return { success: true, message: 'Subscription suspendue', data };
  }

  @Post('subscriptions/:id/resume')
  @ApiOperation({ summary: 'Reprendre une subscription (admin)' })
  async resumeSubscription(@Param('id') id: string) {
    const data = await this.billingService.resumeSubscription(id);
    return { success: true, message: 'Subscription rétablie', data };
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Annuler une subscription (admin)' })
  async cancelSubscription(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.cancelSubscription(id, body);
    return { success: true, message: 'Subscription annulée', data };
  }

  @Post('subscriptions/:id/renew')
  @ApiOperation({ summary: 'Renouveler une subscription (admin)' })
  async renewSubscription(@Param('id') id: string) {
    const data = await this.billingService.renewSubscription(id);
    return { success: true, message: 'Subscription renouvelée', data };
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Liste des factures (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'subscriptionId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async invoices(
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.billingService.listInvoices({ status, tenantId, subscriptionId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Détail d une facture (admin)' })
  async getInvoice(@Param('id') id: string) {
    const data = await this.billingService.getInvoice(id);
    return { success: true, message: 'OK', data };
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Générer une facture (admin)' })
  async generateInvoice(@Body() body: any) {
    const data = await this.billingService.generateInvoice(body);
    return { success: true, message: 'Facture générée', data, statusCode: 201 };
  }

  @Post('invoices/:id/issue')
  @ApiOperation({ summary: 'Émettre une facture (admin)' })
  async issueInvoice(@Param('id') id: string) {
    const data = await this.billingService.issueInvoice(id);
    return { success: true, message: 'Facture émise', data };
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Appliquer un paiement à une facture (admin)' })
  async applyPayment(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.applyPaymentToInvoice(id, body);
    return { success: true, message: 'Paiement appliqué', data };
  }

  @Post('invoices/:id/mark-overdue')
  @ApiOperation({ summary: 'Marquer une facture en retard (admin)' })
  async markOverdue(@Param('id') id: string) {
    const data = await this.billingService.markInvoiceOverdue(id);
    return { success: true, message: 'Facture marquée en retard', data };
  }

  @Post('invoices/:id/void')
  @ApiOperation({ summary: 'Annuler une facture (admin)' })
  async voidInvoice(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.voidInvoice(id, body);
    return { success: true, message: 'Facture annulée', data };
  }

  @Get('payments')
  @ApiOperation({ summary: 'Liste des paiements (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async payments(
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.billingService.listPayments({ status, tenantId, invoiceId, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Détail d un paiement (admin)' })
  async getPayment(@Param('id') id: string) {
    const data = await this.billingService.getPayment(id);
    return { success: true, message: 'OK', data };
  }

  @Get('payments/invoice/:invoiceId')
  @ApiOperation({ summary: 'Paiements pour une facture (admin)' })
  async paymentsForInvoice(@Param('invoiceId') invoiceId: string) {
    const data = await this.billingService.paymentsForInvoice(invoiceId);
    return { success: true, message: 'OK', data };
  }

  @Post('payments')
  @ApiOperation({ summary: 'Initier un paiement (admin)' })
  async initiatePayment(@Body() body: any) {
    const data = await this.billingService.initiatePayment(body);
    return { success: true, message: 'Paiement initié', data, statusCode: 201 };
  }

  @Post('payments/:id/processing')
  @ApiOperation({ summary: 'Marquer un paiement en cours (admin)' })
  async markProcessing(@Param('id') id: string) {
    const data = await this.billingService.markPaymentProcessing(id);
    return { success: true, message: 'Paiement en cours', data };
  }

  @Post('payments/:id/succeed')
  @ApiOperation({ summary: 'Marquer un paiement réussi (admin)' })
  async markSucceeded(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.markPaymentSucceeded(id, body);
    return { success: true, message: 'Paiement réussi', data };
  }

  @Post('payments/:id/fail')
  @ApiOperation({ summary: 'Marquer un paiement échoué (admin)' })
  async markFailed(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.markPaymentFailed(id, body);
    return { success: true, message: 'Paiement échoué', data };
  }

  @Post('payments/:id/refund')
  @ApiOperation({ summary: 'Rembourser un paiement (admin)' })
  async refund(@Param('id') id: string, @Body() body: any) {
    const data = await this.billingService.refundPayment(id, body);
    return { success: true, message: 'Paiement remboursé', data };
  }

  @Get('entitlements/:subscriptionId')
  @ApiOperation({ summary: 'Entitlements d une subscription (admin)' })
  async entitlements(@Param('subscriptionId') subscriptionId: string) {
    const data = await this.billingService.getEntitlements(subscriptionId);
    return { success: true, message: 'OK', data };
  }

  @Get('entitlements/:subscriptionId/:featureCode')
  @ApiOperation({ summary: 'Entitlement spécifique (admin)' })
  async entitlement(@Param('subscriptionId') subscriptionId: string, @Param('featureCode') featureCode: string) {
    const data = await this.billingService.getEntitlement(subscriptionId, featureCode);
    return { success: true, message: 'OK', data };
  }

  @Post('entitlements/:subscriptionId/:featureCode/override')
  @ApiOperation({ summary: 'Override d entitlement (admin)' })
  async createOverride(@Param('subscriptionId') subscriptionId: string, @Param('featureCode') featureCode: string, @Body() body: any) {
    const data = await this.billingService.createEntitlementOverride(subscriptionId, featureCode, body);
    return { success: true, message: 'Override créé', data };
  }

  @Delete('entitlements/:subscriptionId/:featureCode/override')
  @ApiOperation({ summary: 'Retirer override d entitlement (admin)' })
  async removeOverride(@Param('subscriptionId') subscriptionId: string, @Param('featureCode') featureCode: string) {
    const data = await this.billingService.removeEntitlementOverride(subscriptionId, featureCode);
    return { success: true, message: 'OK', data };
  }

  @Get('entitlements/:subscriptionId/:featureCode/quota')
  @ApiOperation({ summary: 'Quota d entitlement (admin)' })
  async quota(@Param('subscriptionId') subscriptionId: string, @Param('featureCode') featureCode: string) {
    const data = await this.billingService.getEntitlementQuota(subscriptionId, featureCode);
    return { success: true, message: 'OK', data };
  }

  @Post('entitlements/:subscriptionId/:featureCode/quota/consume')
  @ApiOperation({ summary: 'Consommer du quota d entitlement (admin)' })
  async consumeQuota(@Param('subscriptionId') subscriptionId: string, @Param('featureCode') featureCode: string, @Body() body: any) {
    const data = await this.billingService.consumeEntitlementQuota(subscriptionId, featureCode, body);
    return { success: true, message: 'OK', data };
  }

  @Get('features')
  @ApiOperation({ summary: 'Liste des features (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async features(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.billingService.listFeatures({ status, search, type, page: page ? parseInt(page, 10) : undefined, limit: limit ? parseInt(limit, 10) : undefined });
    return { success: true, message: 'OK', data };
  }

  @Get('features/:code')
  @ApiOperation({ summary: 'Détail d une feature (admin)' })
  async getFeature(@Param('code') code: string) {
    const data = await this.billingService.getFeature(code);
    return { success: true, message: 'OK', data };
  }

  @Post('features')
  @ApiOperation({ summary: 'Créer une feature (admin)' })
  async createFeature(@Body() body: any) {
    const data = await this.billingService.createFeature(body);
    return { success: true, message: 'Feature créée', data, statusCode: 201 };
  }

  @Patch('features/:code')
  @ApiOperation({ summary: 'Mettre à jour une feature (admin)' })
  async updateFeature(@Param('code') code: string, @Body() body: any) {
    const data = await this.billingService.updateFeature(code, body);
    return { success: true, message: 'Feature mise à jour', data };
  }

  @Post('features/:code/deprecate')
  @ApiOperation({ summary: 'Déprédier une feature (admin)' })
  async deprecateFeature(@Param('code') code: string) {
    const data = await this.billingService.deprecateFeature(code);
    return { success: true, message: 'Feature dépréciée', data };
  }

  @Post('access/decide')
  @ApiOperation({ summary: 'Vérifier l accès à une feature (admin)' })
  async checkAccess(@Body() body: any) {
    const data = await this.billingService.checkAccess(body);
    return { success: true, message: 'OK', data };
  }
}
