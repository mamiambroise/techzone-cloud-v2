import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ErpAdapterService } from './erp-adapter.service';
import { ErpRegistryService } from '../erp-registry/erp-registry.service';
import { Public } from '../iam/decorators/public.decorator';
import { Permissions } from '../iam/iam-permissions.guard';
import { CurrentUser, IamAuthContext } from '../iam/decorators/current-user.decorator';
import { ERP_READ, ERP_WRITE } from '../iam/iam.constants';
import { ForbiddenException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { CreateStockAlertDto } from './dto/create-stock-alert.dto';
import { CreateReturnDto } from './dto/create-return.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateAgendaEventDto } from './dto/create-agenda-event.dto';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('erp-adapter')
@Controller('erp')
export class ErpAdapterController {
  private readonly logger = new Logger(ErpAdapterController.name);

  constructor(
    private readonly adapterService: ErpAdapterService,
    private readonly erpRegistry: ErpRegistryService,
  ) {}

  private async resolveErpFromTenant(principal: IamAuthContext): Promise<string> {
    const tenantId = principal.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('TENANT_REQUIRED: tenantId manquant dans le principal');
    }
    const erp = await this.erpRegistry.getActiveForTenant({ tenantId });
    return erp.code;
  }

  // === ADAPTATEURS ===

  @Permissions(ERP_READ)
  @Get('adapters')
  @ApiOperation({ summary: 'Lister les adaptateurs disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des adaptateurs' })
  getAdapters() {
    return { adapters: this.adapterService.getAvailableAdapters() };
  }

  // === CLIENTS ===

  @Permissions(ERP_READ)
  @Get('clients')
  @ApiOperation({ summary: 'Lister les clients depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des clients' })
  async getClients(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/clients [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getClients();
  }

  @Permissions(ERP_READ)
  @Get('clients/:id')
  @ApiOperation({ summary: 'Details d un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client trouve' })
  @ApiResponse({ status: 404, description: 'Client non trouve' })
  async getClientById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/clients/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getClientById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un client' })
  @ApiResponse({ status: 201, description: 'Client cree' })
  async createClient(@Body() dto: CreateClientDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/clients [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createClient(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('clients/:id')
  @ApiOperation({ summary: 'Modifier un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 200, description: 'Client mis a jour' })
  async updateClient(@Param('id') id: string, @Body() dto: CreateClientDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/clients/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateClient(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiResponse({ status: 204, description: 'Client supprime' })
  async deleteClient(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/clients/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteClient(id);
  }

  // === PRODUITS ===

  @Permissions(ERP_READ)
  @Get('products')
  @ApiOperation({ summary: 'Lister les produits depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des produits' })
  async getProducts(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/products [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProducts();
  }

  @Permissions(ERP_READ)
  @Get('products/:id')
  @ApiOperation({ summary: 'Details d un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit trouve' })
  async getProductById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/products/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProductById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un produit' })
  @ApiResponse({ status: 201, description: 'Produit cree' })
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/products [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createProduct({ ...dto, stock: dto.stock ?? 0 });
  }

  @Permissions(ERP_WRITE)
  @Put('products/:id')
  @ApiOperation({ summary: 'Modifier un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produit mis a jour' })
  async updateProduct(@Param('id') id: string, @Body() dto: CreateProductDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/products/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateProduct(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 204, description: 'Produit supprime' })
  async deleteProduct(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/products/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteProduct(id);
  }

  // === COMMANDES ===

  @Permissions(ERP_READ)
  @Get('orders')
  @ApiOperation({ summary: 'Lister les commandes depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des commandes' })
  async getOrders(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/orders [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getOrders();
  }

  @Permissions(ERP_READ)
  @Get('orders/:id')
  @ApiOperation({ summary: 'Details d une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Commande trouvee' })
  async getOrderById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/orders/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getOrderById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une commande' })
  @ApiResponse({ status: 201, description: 'Commande creee' })
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/orders [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createOrder(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('orders/:id')
  @ApiOperation({ summary: 'Modifier une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Commande mise a jour' })
  async updateOrder(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/orders/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateOrder(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('orders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 204, description: 'Commande supprimee' })
  async deleteOrder(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/orders/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteOrder(id);
  }

  // === STOCK ===

  @Permissions(ERP_READ)
  @Get('stock/:productId')
  @ApiOperation({ summary: 'Consulter le stock d un produit' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Information de stock' })
  async getStock(@Param('productId') productId: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/stock/${productId} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStock(productId);
  }

  @Permissions(ERP_WRITE)
  @Put('stock/:productId')
  @ApiOperation({ summary: 'Mettre a jour le stock d un produit' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Stock mis a jour' })
  async updateStock(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @CurrentUser() principal: IamAuthContext,
  ) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/stock/${productId} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateStock(productId, quantity);
  }

  @Permissions(ERP_READ)
  @Get('stocks')
  @ApiOperation({ summary: 'Lister le stock de tous les produits' })
  @ApiResponse({ status: 200, description: 'Stocks de tous les produits' })
  async getStocks(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/stocks [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStocks();
  }

  // === FOURNISSEURS ===

  @Permissions(ERP_READ)
  @Get('suppliers')
  @ApiOperation({ summary: 'Lister les fournisseurs depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs' })
  async getSuppliers(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/suppliers [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getSuppliers();
  }

  @Permissions(ERP_READ)
  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Details d un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur trouve' })
  async getSupplierById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/suppliers/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getSupplierById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un fournisseur' })
  @ApiResponse({ status: 201, description: 'Fournisseur cree' })
  async createSupplier(@Body() dto: CreateSupplierDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/suppliers [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createSupplier(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Modifier un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur mis a jour' })
  async updateSupplier(@Param('id') id: string, @Body() dto: CreateSupplierDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/suppliers/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateSupplier(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiResponse({ status: 204, description: 'Fournisseur supprime' })
  async deleteSupplier(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/suppliers/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteSupplier(id);
  }

  // === DEVIS ===

  @Permissions(ERP_READ)
  @Get('quotes')
  @ApiOperation({ summary: 'Lister les devis depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des devis' })
  async getQuotes(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/quotes [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getQuotes();
  }

  @Permissions(ERP_READ)
  @Get('quotes/:id')
  @ApiOperation({ summary: 'Details d un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis trouve' })
  async getQuoteById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/quotes/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getQuoteById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('quotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un devis' })
  @ApiResponse({ status: 201, description: 'Devis cree' })
  async createQuote(@Body() dto: CreateQuoteDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/quotes [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createQuote(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('quotes/:id')
  @ApiOperation({ summary: 'Modifier un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 200, description: 'Devis mis a jour' })
  async updateQuote(@Param('id') id: string, @Body() dto: Partial<CreateQuoteDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/quotes/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateQuote(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('quotes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiResponse({ status: 204, description: 'Devis supprime' })
  async deleteQuote(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/quotes/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteQuote(id);
  }

  // === FACTURES ===

  @Permissions(ERP_READ)
  @Get('invoices')
  @ApiOperation({ summary: 'Lister les factures depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async getInvoices(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/invoices [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInvoices();
  }

  @Permissions(ERP_READ)
  @Get('invoices/:id')
  @ApiOperation({ summary: 'Details d une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture trouvee' })
  async getInvoiceById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/invoices/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInvoiceById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une facture' })
  @ApiResponse({ status: 201, description: 'Facture creee' })
  async createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/invoices [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createInvoice(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('invoices/:id')
  @ApiOperation({ summary: 'Modifier une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture mise a jour' })
  async updateInvoice(@Param('id') id: string, @Body() dto: Partial<CreateInvoiceDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/invoices/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateInvoice(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiResponse({ status: 204, description: 'Facture supprimee' })
  async deleteInvoice(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/invoices/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteInvoice(id);
  }

  // === PAIEMENTS ===

  @Permissions(ERP_READ)
  @Get('payments')
  @ApiOperation({ summary: 'Lister les paiements depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des paiements' })
  async getPayments(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/payments [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPayments();
  }

  @Permissions(ERP_READ)
  @Get('payments/:id')
  @ApiOperation({ summary: 'Details d un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiResponse({ status: 200, description: 'Paiement trouve' })
  async getPaymentById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/payments/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPaymentById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  @ApiResponse({ status: 201, description: 'Paiement enregistre' })
  async createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/payments [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createPayment(dto);
  }

  // === ENTREPOTS ===

  @Permissions(ERP_READ)
  @Get('warehouses')
  @ApiOperation({ summary: 'Lister les entrepots depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des entrepots' })
  async getWarehouses(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/warehouses [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getWarehouses();
  }

  @Permissions(ERP_READ)
  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Details d un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiResponse({ status: 200, description: 'Entrepot trouve' })
  async getWarehouseById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/warehouses/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getWarehouseById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('warehouses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un entrepot' })
  @ApiResponse({ status: 201, description: 'Entrepot cree' })
  async createWarehouse(@Body() dto: CreateWarehouseDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/warehouses [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createWarehouse(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('warehouses/:id')
  @ApiOperation({ summary: 'Modifier un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiResponse({ status: 200, description: 'Entrepot mis a jour' })
  async updateWarehouse(@Param('id') id: string, @Body() dto: CreateWarehouseDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/warehouses/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateWarehouse(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('warehouses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiResponse({ status: 204, description: 'Entrepot supprime' })
  async deleteWarehouse(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/warehouses/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteWarehouse(id);
  }

  // === EXPEDITIONS ===

  @Permissions(ERP_READ)
  @Get('shipments')
  @ApiOperation({ summary: 'Lister les expeditions depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des expeditions' })
  async getShipments(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/shipments [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getShipments();
  }

  @Permissions(ERP_READ)
  @Get('shipments/:id')
  @ApiOperation({ summary: 'Details d une expedition' })
  @ApiParam({ name: 'id', description: 'ID de lexpedition' })
  @ApiResponse({ status: 200, description: 'Expedition trouvee' })
  async getShipmentById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/shipments/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getShipmentById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une expedition' })
  @ApiResponse({ status: 201, description: 'Expedition creee' })
  async createShipment(@Body() dto: CreateShipmentDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/shipments [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createShipment(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('shipments/:id')
  @ApiOperation({ summary: 'Modifier une expedition' })
  @ApiParam({ name: 'id', description: 'ID de lexpedition' })
  @ApiResponse({ status: 200, description: 'Expedition mise a jour' })
  async updateShipment(@Param('id') id: string, @Body() dto: Partial<CreateShipmentDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/shipments/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateShipment(id, dto);
  }

  // === DOCUMENTS ===

  @Permissions(ERP_READ)
  @Get('documents')
  @ApiOperation({ summary: 'Lister les documents depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des documents' })
  async getDocuments(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/documents [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getDocuments();
  }

  @Permissions(ERP_READ)
  @Get('documents/:id')
  @ApiOperation({ summary: 'Details d un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 200, description: 'Document trouve' })
  async getDocumentById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/documents/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getDocumentById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un document' })
  @ApiResponse({ status: 201, description: 'Document cree' })
  async createDocument(@Body() dto: CreateDocumentDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/documents [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createDocument(dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiResponse({ status: 204, description: 'Document supprime' })
  async deleteDocument(@Param('id') id: string, @CurrentUser() principal: IamAuthContext): Promise<void> {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/documents/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteDocument(id);
  }

  // === MOUVEMENTS DE STOCK ===

  @Permissions(ERP_READ)
  @Get('stock-movements')
  @ApiOperation({ summary: 'Lister les mouvements de stock depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des mouvements de stock' })
  async getStockMovements(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/stock-movements [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStockMovements();
  }

  @Permissions(ERP_WRITE)
  @Post('stock-movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un mouvement de stock' })
  @ApiResponse({ status: 201, description: 'Mouvement cree' })
  async createStockMovement(@Body() dto: CreateStockMovementDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/stock-movements [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createStockMovement(dto);
  }

  // === ACHATS (bons de commande fournisseurs) ===

  @Permissions(ERP_READ)
  @Get('purchases')
  @ApiOperation({ summary: 'Lister les achats depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des achats' })
  async getPurchaseOrders(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/purchases [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPurchaseOrders();
  }

  @Permissions(ERP_READ)
  @Get('purchases/:id')
  @ApiOperation({ summary: 'Details d un achat' })
  @ApiParam({ name: 'id', description: 'ID de l achat' })
  @ApiResponse({ status: 200, description: 'Achat trouve' })
  async getPurchaseOrderById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/purchases/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPurchaseOrderById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('purchases')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un achat' })
  @ApiResponse({ status: 201, description: 'Achat cree' })
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/purchases [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createPurchaseOrder(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('purchases/:id')
  @ApiOperation({ summary: 'Mettre a jour un achat' })
  @ApiParam({ name: 'id', description: 'ID de l achat' })
  @ApiResponse({ status: 200, description: 'Achat mis a jour' })
  async updatePurchaseOrder(@Param('id') id: string, @Body() dto: CreatePurchaseOrderDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/purchases/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updatePurchaseOrder(id, dto);
  }

  // === PROJETS ===

  @Permissions(ERP_READ)
  @Get('projects')
  @ApiOperation({ summary: 'Lister les projets depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des projets' })
  async getProjects(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/projects [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProjects();
  }

  @Permissions(ERP_READ)
  @Get('projects/:id')
  @ApiOperation({ summary: 'Details d un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Projet trouve' })
  async getProjectById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/projects/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProjectById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un projet' })
  @ApiResponse({ status: 201, description: 'Projet cree' })
  async createProject(@Body() dto: CreateProjectDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/projects [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createProject(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('projects/:id')
  @ApiOperation({ summary: 'Mettre a jour un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({ status: 200, description: 'Projet mis a jour' })
  async updateProject(@Param('id') id: string, @Body() dto: CreateProjectDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/projects/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateProject(id, dto);
  }

  // === AGENDA ===

  @Permissions(ERP_READ)
  @Get('agenda')
  @ApiOperation({ summary: 'Lister les evenements d agenda depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des evenements' })
  async getAgenda(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/agenda [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getAgenda();
  }

  @Permissions(ERP_WRITE)
  @Post('agenda')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un evenement d agenda' })
  @ApiResponse({ status: 201, description: 'Evenement cree' })
  async createAgendaEvent(@Body() dto: CreateAgendaEventDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/agenda [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createAgendaEvent(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('agenda/:id')
  @ApiOperation({ summary: 'Modifier un evenement d agenda' })
  @ApiParam({ name: 'id', description: 'ID de l evenement' })
  @ApiResponse({ status: 200, description: 'Evenement modifie' })
  async updateAgendaEvent(@Param('id') id: string, @Body() dto: Partial<CreateAgendaEventDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/agenda/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateAgendaEvent(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('agenda/:id')
  @ApiOperation({ summary: 'Supprimer un evenement d agenda' })
  @ApiParam({ name: 'id', description: 'ID de l evenement' })
  @ApiResponse({ status: 200, description: 'Evenement supprime' })
  async deleteAgendaEvent(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/agenda/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteAgendaEvent(id);
    return { success: true, id };
  }

  // === VARIANTS DE PRODUITS ===

  @Permissions(ERP_READ)
  @Get('product-variants')
  @ApiOperation({ summary: 'Lister les variantes de produits depuis l\'ERP du tenant' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filtrer par produit' })
  @ApiResponse({ status: 200, description: 'Liste des variantes' })
  async getProductVariants(@CurrentUser() principal: IamAuthContext, @Query('productId') productId?: string) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/product-variants [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    if (productId) return adapter.getProductVariantsByProduct(productId);
    return adapter.getProductVariants();
  }

  @Permissions(ERP_WRITE)
  @Post('product-variants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une variante de produit' })
  @ApiResponse({ status: 201, description: 'Variante creee' })
  async createProductVariant(@Body() dto: CreateProductVariantDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/product-variants [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createProductVariant(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('product-variants/:id')
  @ApiOperation({ summary: 'Mettre a jour une variante de produit' })
  @ApiParam({ name: 'id', description: 'ID de la variante' })
  @ApiResponse({ status: 200, description: 'Variante mise a jour' })
  async updateProductVariant(@Param('id') id: string, @Body() dto: Partial<CreateProductVariantDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/product-variants/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateProductVariant(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('product-variants/:id')
  @ApiOperation({ summary: 'Supprimer une variante de produit' })
  @ApiParam({ name: 'id', description: 'ID de la variante' })
  @ApiResponse({ status: 200, description: 'Variante supprimee' })
  async deleteProductVariant(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/product-variants/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteProductVariant(id);
    return { success: true, id };
  }

  // === SERVICES ===

  @Permissions(ERP_READ)
  @Get('services')
  @ApiOperation({ summary: 'Lister les services depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des services' })
  async getServices(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/services [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getServices();
  }

  @Permissions(ERP_READ)
  @Get('services/:id')
  @ApiOperation({ summary: 'Details d un service' })
  @ApiParam({ name: 'id', description: 'ID du service' })
  @ApiResponse({ status: 200, description: 'Service trouve' })
  async getServiceById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/services/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getServiceById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un service' })
  @ApiResponse({ status: 201, description: 'Service cree' })
  async createService(@Body() dto: CreateServiceDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/services [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createService(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('services/:id')
  @ApiOperation({ summary: 'Mettre a jour un service' })
  @ApiParam({ name: 'id', description: 'ID du service' })
  @ApiResponse({ status: 200, description: 'Service mis a jour' })
  async updateService(@Param('id') id: string, @Body() dto: Partial<CreateServiceDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/services/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateService(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('services/:id')
  @ApiOperation({ summary: 'Supprimer un service' })
  @ApiParam({ name: 'id', description: 'ID du service' })
  @ApiResponse({ status: 200, description: 'Service supprime' })
  async deleteService(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`DELETE /erp/services/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteService(id);
    return { success: true, id };
  }

  // === TRANSFERTS DE STOCK ===

  @Permissions(ERP_READ)
  @Get('stock-transfers')
  @ApiOperation({ summary: 'Lister les transferts de stock depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des transferts' })
  async getStockTransfers(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/stock-transfers [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStockTransfers();
  }

  @Permissions(ERP_WRITE)
  @Post('stock-transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un transfert de stock' })
  @ApiResponse({ status: 201, description: 'Transfert cree' })
  async createStockTransfer(@Body() dto: CreateStockTransferDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/stock-transfers [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createStockTransfer(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('stock-transfers/:id')
  @ApiOperation({ summary: 'Mettre a jour un transfert de stock' })
  @ApiParam({ name: 'id', description: 'ID du transfert' })
  @ApiResponse({ status: 200, description: 'Transfert mis a jour' })
  async updateStockTransfer(@Param('id') id: string, @Body() dto: Partial<CreateStockTransferDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/stock-transfers/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateStockTransfer(id, dto);
  }

  // === INVENTAIRES ===

  @Permissions(ERP_READ)
  @Get('inventories')
  @ApiOperation({ summary: 'Lister les inventaires depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des inventaires' })
  async getInventories(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/inventories [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInventories();
  }

  @Permissions(ERP_READ)
  @Get('inventories/:id')
  @ApiOperation({ summary: 'Details d un inventaire' })
  @ApiParam({ name: 'id', description: 'ID de l inventaire' })
  @ApiResponse({ status: 200, description: 'Inventaire trouve' })
  async getInventoryById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/inventories/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInventoryById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('inventories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un inventaire' })
  @ApiResponse({ status: 201, description: 'Inventaire cree' })
  async createInventory(@Body() dto: CreateInventoryDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/inventories [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createInventory(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('inventories/:id')
  @ApiOperation({ summary: 'Mettre a jour un inventaire' })
  @ApiParam({ name: 'id', description: 'ID de l inventaire' })
  @ApiResponse({ status: 200, description: 'Inventaire mis a jour' })
  async updateInventory(@Param('id') id: string, @Body() dto: Partial<CreateInventoryDto>, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`PUT /erp/inventories/${id} [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateInventory(id, dto);
  }

  // === ALERTES STOCK ===

  @Permissions(ERP_READ)
  @Get('stock-alerts')
  @ApiOperation({ summary: 'Lister les alertes de stock depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des alertes' })
  async getStockAlerts(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/stock-alerts [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStockAlerts();
  }

  @Permissions(ERP_WRITE)
  @Post('stock-alerts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une alerte de stock' })
  @ApiResponse({ status: 201, description: 'Alerte creee' })
  async createStockAlert(@Body() dto: CreateStockAlertDto, @CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`POST /erp/stock-alerts [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createStockAlert(dto);
  }

  // === RETOURS ===

  @Permissions(ERP_READ)
  @Get('returns')
  @ApiOperation({ summary: 'Lister les retours depuis l\'ERP du tenant' })
  @ApiResponse({ status: 200, description: 'Liste des retours' })
  async getReturns(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    this.logger.log(`GET /erp/returns [tenant=${principal.tenantId}, erp=${erpCode}]`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getReturns();
  }

  @Permissions(ERP_READ)
  @Get('returns/:id')
  @ApiOperation({ summary: 'Details d un retour' })
  @ApiParam({ name: 'id', description: 'ID du retour' })
  @ApiResponse({ status: 200, description: 'Retour trouve' })
  async getReturnById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getReturnById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('returns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un retour' })
  @ApiResponse({ status: 201, description: 'Retour cree' })
  async createReturn(@Body() dto: CreateReturnDto, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.createReturn(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('returns/:id')
  @ApiOperation({ summary: 'Mettre a jour un retour' })
  @ApiParam({ name: 'id', description: 'ID du retour' })
  @ApiResponse({ status: 200, description: 'Retour mis a jour' })
  async updateReturn(@Param('id') id: string, @Body() dto: Partial<CreateReturnDto>, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.updateReturn(id, dto);
  }

  // === PROMOTIONS ===

  @Permissions(ERP_READ)
  @Get('promotions')
  @ApiOperation({ summary: 'Lister les promotions depuis un ERP' })
  @ApiResponse({ status: 200, description: 'Liste des promotions' })
  async getPromotions(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getPromotions();
  }

  @Permissions(ERP_READ)
  @Get('promotions/:id')
  @ApiOperation({ summary: 'Details d une promotion' })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({ status: 200, description: 'Promotion trouvee' })
  async getPromotionById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getPromotionById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('promotions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une promotion' })
  @ApiResponse({ status: 201, description: 'Promotion creee' })
  async createPromotion(@Body() dto: CreatePromotionDto, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.createPromotion(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('promotions/:id')
  @ApiOperation({ summary: 'Mettre a jour une promotion' })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({ status: 200, description: 'Promotion mise a jour' })
  async updatePromotion(@Param('id') id: string, @Body() dto: Partial<CreatePromotionDto>, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.updatePromotion(id, dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('promotions/:id')
  @ApiOperation({ summary: 'Supprimer une promotion' })
  @ApiParam({ name: 'id', description: 'ID de la promotion' })
  @ApiResponse({ status: 200, description: 'Promotion supprimee' })
  async deletePromotion(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    await adapter.deletePromotion(id);
    return { success: true, id };
  }

  // === CAISSES ===

  @Permissions(ERP_READ)
  @Get('cash-registers')
  @ApiOperation({ summary: 'Lister les caisses depuis un ERP' })
  @ApiResponse({ status: 200, description: 'Liste des caisses' })
  async getCashRegisters(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getCashRegisters();
  }

  @Permissions(ERP_READ)
  @Get('cash-registers/:id')
  @ApiOperation({ summary: 'Details d une caisse' })
  @ApiParam({ name: 'id', description: 'ID de la caisse' })
  @ApiResponse({ status: 200, description: 'Caisse trouvee' })
  async getCashRegisterById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getCashRegisterById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('cash-registers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une caisse' })
  @ApiResponse({ status: 201, description: 'Caisse creee' })
  async createCashRegister(@Body() dto: CreateCashRegisterDto, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.createCashRegister(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('cash-registers/:id')
  @ApiOperation({ summary: 'Mettre a jour une caisse' })
  @ApiParam({ name: 'id', description: 'ID de la caisse' })
  @ApiResponse({ status: 200, description: 'Caisse mise a jour' })
  async updateCashRegister(@Param('id') id: string, @Body() dto: Partial<CreateCashRegisterDto>, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.updateCashRegister(id, dto);
  }

  // === DEPENSES ===

  @Permissions(ERP_READ)
  @Get('expenses')
  @ApiOperation({ summary: 'Lister les depenses depuis un ERP' })
  @ApiResponse({ status: 200, description: 'Liste des depenses' })
  async getExpenses(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getExpenses();
  }

  @Permissions(ERP_READ)
  @Get('expenses/:id')
  @ApiOperation({ summary: 'Details d une depense' })
  @ApiParam({ name: 'id', description: 'ID de la depense' })
  @ApiResponse({ status: 200, description: 'Depense trouvee' })
  async getExpenseById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getExpenseById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une depense' })
  @ApiResponse({ status: 201, description: 'Depense creee' })
  async createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.createExpense(dto);
  }

  @Permissions(ERP_WRITE)
  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Supprimer une depense' })
  @ApiParam({ name: 'id', description: 'ID de la depense' })
  @ApiResponse({ status: 200, description: 'Depense supprimee' })
  async deleteExpense(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    await adapter.deleteExpense(id);
    return { success: true, id };
  }

  // === RESERVATIONS ===

  @Permissions(ERP_READ)
  @Get('reservations')
  @ApiOperation({ summary: 'Lister les reservations depuis un ERP' })
  @ApiResponse({ status: 200, description: 'Liste des reservations' })
  async getReservations(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getReservations();
  }

  @Permissions(ERP_READ)
  @Get('reservations/:id')
  @ApiOperation({ summary: 'Details d une reservation' })
  @ApiParam({ name: 'id', description: 'ID de la reservation' })
  @ApiResponse({ status: 200, description: 'Reservation trouvee' })
  async getReservationById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getReservationById(id);
  }

  @Permissions(ERP_WRITE)
  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une reservation' })
  @ApiResponse({ status: 201, description: 'Reservation creee' })
  async createReservation(@Body() dto: CreateReservationDto, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.createReservation(dto);
  }

  @Permissions(ERP_WRITE)
  @Put('reservations/:id')
  @ApiOperation({ summary: 'Mettre a jour une reservation' })
  @ApiParam({ name: 'id', description: 'ID de la reservation' })
  @ApiResponse({ status: 200, description: 'Reservation mise a jour' })
  async updateReservation(@Param('id') id: string, @Body() dto: Partial<CreateReservationDto>, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.updateReservation(id, dto);
  }

  // === UTILISATEURS ===

  @Permissions(ERP_READ)
  @Get('users')
  @ApiOperation({ summary: 'Lister les utilisateurs depuis un ERP' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  async getUsers(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getUsers();
  }

  @Permissions(ERP_READ)
  @Get('users/me')
  @ApiOperation({ summary: 'Utilisateur courant (proprietaire de la cle API)' })
  @ApiResponse({ status: 200, description: 'Utilisateur courant' })
  async getCurrentUser(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getCurrentUser();
  }

  @Permissions(ERP_READ)
  @Get('users/:id')
  @ApiOperation({ summary: 'Details d un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouve' })
  async getUserById(@Param('id') id: string, @CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getUserById(id);
  }

  // === STATISTIQUES ===

  @Permissions(ERP_READ)
  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques ERP' })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  async getStats(@CurrentUser() principal: IamAuthContext) {
    const adapter = this.adapterService.getAdapter(await this.resolveErpFromTenant(principal));
    return adapter.getStats();
  }

  // === SANTE ===

  /**
   * Public platform health endpoint.
   *
   * SAFE: does NOT accept arbitrary `?erp=` provider selection.
   * Returns only platform-level adapter availability (which adapters are
   * registered in the process), never tenant-specific configuration or
   * tenant-specific health.
   *
   * Tenant-specific ERP health requires authenticated, tenant-resolved
   * context — see GET /erp/health/tenant below.
   */
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Sante de la plateforme (publique, sans contexte tenant)' })
  @ApiResponse({ status: 200, description: 'Etat de sante des adaptateurs enregistres' })
  async healthCheck() {
    this.logger.log('GET /erp/health (public platform)');
    const adapters = this.adapterService.getAvailableAdapters();
    return {
      status: 'CONNECTED',
      adapters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Tenant-resolved ERP health.
   * Authenticated. Resolves the tenant's active ERP and returns its
   * canonical health state (CONNECTED | DEGRADED | UNAVAILABLE | NOT_CONFIGURED).
   */
  @Permissions(ERP_READ)
  @Get('health/tenant')
  @ApiOperation({ summary: 'Sante de l ERP actif du tenant (authentifie)' })
  @ApiResponse({ status: 200, description: 'Etat de sante du ERP du tenant' })
  @ApiResponse({ status: 403, description: 'Permission insuffisante' })
  async tenantHealthCheck(@CurrentUser() principal: IamAuthContext) {
    const erpCode = await this.resolveErpFromTenant(principal);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.healthCheck();
  }
}
