import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BillingInterval, PlanStatus, PriceStatus } from '../../generated/prisma/enums';
import { IamAdminGuard } from '../../iam/iam-admin-guard';
import { Permissions } from '../../iam/iam-permissions.guard';
import { BILLING_PLAN_MANAGE, BILLING_PLAN_READ } from '../../iam/iam.constants';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../../iam/decorators/current-user.decorator';
import { BillingCatalogService } from './catalog/billing-catalog.service';
import type {
  CreatePlanInput,
  CreatePriceInput,
  CreateProductInput,
  UpsertFeatureInput,
  UpsertPlanEntitlementInput,
} from './billing.dto';

/**
 * Catalogue public (CDC 7/8/9/14).
 *
 * Le catalogue est PLATFORM GLOBAL : il est lisible par tout utilisateur
 * authentifie (le tenant choisit son plan), mais il n'expose que des Prix
 * ACTIFS. La lecture ne disclose ni clients, ni contrats, ni historique.
 */
@ApiTags('billing-catalog')
@Controller('api/billing/catalog')
export class BillingCatalogController {
  constructor(private readonly catalog: BillingCatalogService) {}

  @Get('products')
  @UseGuards(IamAdminGuard)
  @Permissions(BILLING_PLAN_READ)
  @ApiOperation({ summary: 'Produits de la plateforme (admin Billing)' })
  async listProducts(@Query('status') status?: string, @Query('search') search?: string) {
    return { success: true, message: 'OK', data: await this.catalog.listProducts({ status, search }) };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Plans souscriptibles (Prix ACTIFS uniquement)' })
  @ApiQuery({ name: 'currency', required: false })
  async listPlans(@Query('currency') currency?: string) {
    const plans = await this.catalog.listPlans({ status: PlanStatus.ACTIVE });
    const data = currency
      ? plans.filter((plan) =>
          plan.prices.some(
            (price) => price.currency === currency.toUpperCase() && price.status === PriceStatus.ACTIVE,
          ),
        )
      : plans;
    return { success: true, message: 'OK', data };
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Detail d un plan souscriptible' })
  async getPlan(@Param('id') id: string) {
    const plan = await this.catalog.getPlan(id);
    return {
      success: true,
      message: 'OK',
      data: { ...plan, prices: plan.prices.filter((price) => price.status === PriceStatus.ACTIVE) },
    };
  }

  @Get('prices')
  @ApiOperation({ summary: 'Prix actifs du catalogue' })
  @ApiQuery({ name: 'planId', required: false })
  @ApiQuery({ name: 'currency', required: false })
  async listPrices(@Query('planId') planId?: string, @Query('currency') currency?: string) {
    return {
      success: true,
      message: 'OK',
      data: await this.catalog.listPrices({
        planId,
        currency: currency?.toUpperCase(),
        status: PriceStatus.ACTIVE,
      }),
    };
  }

  @Get('features')
  @UseGuards(IamAdminGuard)
  @Permissions(BILLING_PLAN_READ)
  @ApiOperation({ summary: 'Referentiel des cles d entitlement (admin)' })
  async listFeatures(@Query('search') search?: string) {
    return { success: true, message: 'OK', data: await this.catalog.listFeatures({ search }) };
  }

  @Get('intervals')
  @ApiOperation({ summary: 'Cycles de facturation supportes' })
  intervals() {
    return { success: true, message: 'OK', data: Object.values(BillingInterval) };
  }
}

/**
 * Administration du catalogue. Reservee a une permission Billing explicite :
 * creer un plan, un prix ou un entitlement est une operation commerciale
 * sensible (CDC 79) jamais deroulee par un simple utilisateur.
 */
@ApiTags('billing-catalog-admin')
@Controller('api/billing/catalog')
@UseGuards(IamAdminGuard)
export class BillingCatalogAdminController {
  constructor(private readonly catalog: BillingCatalogService) {}

  @Post('products')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Creer un produit' })
  async createProduct(@CurrentUser() ctx: IamAuthContext, @Body() body: CreateProductInput) {
    const data = await this.catalog.createProduct(body, ctx.userId);
    return { success: true, message: 'Produit cree', data, statusCode: 201 };
  }

  @Post('plans')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Creer un plan' })
  async createPlan(@CurrentUser() ctx: IamAuthContext, @Body() body: CreatePlanInput) {
    const data = await this.catalog.createPlan(body, ctx.userId);
    return { success: true, message: 'Plan cree', data, statusCode: 201 };
  }

  @Post('plans/:id/status')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Changer le statut d un plan (ACTIVE / DEPRECATED / ARCHIVED)' })
  async setPlanStatus(
    @CurrentUser() ctx: IamAuthContext,
    @Param('id') id: string,
    @Body() body: { status: PlanStatus },
  ) {
    const data = await this.catalog.setPlanStatus(id, body.status, ctx.userId);
    return { success: true, message: 'Statut du plan mis a jour', data };
  }

  @Post('plans/:id/entitlements')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Definir un entitlement de plan' })
  async setPlanEntitlement(
    @CurrentUser() ctx: IamAuthContext,
    @Param('id') id: string,
    @Body() body: UpsertPlanEntitlementInput,
  ) {
    const data = await this.catalog.setPlanEntitlement(id, body, ctx.userId);
    return { success: true, message: 'Entitlement definie', data };
  }

  @Post('prices')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Creer un prix' })
  async createPrice(@CurrentUser() ctx: IamAuthContext, @Body() body: CreatePriceInput) {
    const data = await this.catalog.createPrice(body, ctx.userId);
    return { success: true, message: 'Prix cree', data, statusCode: 201 };
  }

  @Post('prices/:id/deactivate')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Desactiver un prix non souscrit' })
  async deactivatePrice(@CurrentUser() ctx: IamAuthContext, @Param('id') id: string) {
    const data = await this.catalog.deactivatePrice(id, ctx.userId);
    return { success: true, message: 'Prix desactive', data };
  }

  @Post('features')
  @Permissions(BILLING_PLAN_MANAGE)
  @ApiOperation({ summary: 'Declarer une cle d entitlement' })
  async upsertFeature(@CurrentUser() ctx: IamAuthContext, @Body() body: UpsertFeatureInput) {
    const data = await this.catalog.upsertFeature(body, ctx.userId);
    return { success: true, message: 'Cle d entitlement enregistree', data };
  }
}