import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ErpAdapterService } from './erp-adapter.service';
import { Public } from '../iam/decorators/public.decorator';
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

  constructor(private readonly adapterService: ErpAdapterService) {}

  // === ADAPTATEURS ===

  @Get('adapters')
  @ApiOperation({ summary: 'Lister les adaptateurs disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des adaptateurs' })
  getAdapters() {
    return { adapters: this.adapterService.getAvailableAdapters() };
  }

  // === CLIENTS ===

  @Get('clients')
  @ApiOperation({ summary: 'Lister les clients depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false, description: 'Code ERP (defaut: MOCK)' })
  @ApiResponse({ status: 200, description: 'Liste des clients' })
  async getClients(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/clients?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getClients();
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Details d un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Client trouve' })
  @ApiResponse({ status: 404, description: 'Client non trouve' })
  async getClientById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/clients/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getClientById(id);
  }

  @Post('clients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un client' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Client cree' })
  async createClient(@Body() dto: CreateClientDto, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`POST /erp/clients?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createClient(dto);
  }

  @Put('clients/:id')
  @ApiOperation({ summary: 'Modifier un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Client mis a jour' })
  async updateClient(@Param('id') id: string, @Body() dto: CreateClientDto, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`PUT /erp/clients/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateClient(id, dto);
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', description: 'ID du client' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Client supprime' })
  async deleteClient(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    this.logger.log(`DELETE /erp/clients/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteClient(id);
  }

  // === PRODUITS ===

  @Get('products')
  @ApiOperation({ summary: 'Lister les produits depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des produits' })
  async getProducts(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/products?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProducts();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Details d un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Produit trouve' })
  async getProductById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/products/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProductById(id);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Produit cree' })
  async createProduct(@Body() dto: CreateProductDto, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`POST /erp/products?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createProduct({ ...dto, stock: dto.stock ?? 0 });
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Modifier un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Produit mis a jour' })
  async updateProduct(@Param('id') id: string, @Body() dto: CreateProductDto, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`PUT /erp/products/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Produit supprime' })
  async deleteProduct(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    this.logger.log(`DELETE /erp/products/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteProduct(id);
  }

  // === COMMANDES ===

  @Get('orders')
  @ApiOperation({ summary: 'Lister les commandes depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des commandes' })
  async getOrders(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/orders?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getOrders();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Details d une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Commande trouvee' })
  async getOrderById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/orders/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getOrderById(id);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une commande' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Commande creee' })
  async createOrder(@Body() dto: CreateOrderDto, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`POST /erp/orders?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createOrder(dto);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Modifier une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Commande mise a jour' })
  async updateOrder(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`PUT /erp/orders/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateOrder(id, dto);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Commande supprimee' })
  async deleteOrder(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    this.logger.log(`DELETE /erp/orders/${id}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteOrder(id);
  }

  // === STOCK ===

  @Get('stock/:productId')
  @ApiOperation({ summary: 'Consulter le stock d un produit' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Information de stock' })
  async getStock(@Param('productId') productId: string, @Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/stock/${productId}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStock(productId);
  }

  @Put('stock/:productId')
  @ApiOperation({ summary: 'Mettre a jour le stock d un produit' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Stock mis a jour' })
  async updateStock(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Query('erp') erpCode = 'MOCK',
  ) {
    this.logger.log(`PUT /erp/stock/${productId}?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateStock(productId, quantity);
  }

  @Get('stocks')
  @ApiOperation({ summary: 'Lister le stock de tous les produits' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Stocks de tous les produits' })
  async getStocks(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/stocks?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStocks();
  }

  // === FOURNISSEURS ===

  @Get('suppliers')
  @ApiOperation({ summary: 'Lister les fournisseurs depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs' })
  async getSuppliers(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/suppliers?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getSuppliers();
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Details d un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Fournisseur trouve' })
  async getSupplierById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getSupplierById(id);
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un fournisseur' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Fournisseur cree' })
  async createSupplier(@Body() dto: CreateSupplierDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createSupplier(dto);
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Modifier un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Fournisseur mis a jour' })
  async updateSupplier(@Param('id') id: string, @Body() dto: CreateSupplierDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiParam({ name: 'id', description: 'ID du fournisseur' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Fournisseur supprime' })
  async deleteSupplier(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteSupplier(id);
  }

  // === DEVIS ===

  @Get('quotes')
  @ApiOperation({ summary: 'Lister les devis depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des devis' })
  async getQuotes(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getQuotes();
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Details d un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Devis trouve' })
  async getQuoteById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getQuoteById(id);
  }

  @Post('quotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un devis' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Devis cree' })
  async createQuote(@Body() dto: CreateQuoteDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createQuote(dto);
  }

  @Put('quotes/:id')
  @ApiOperation({ summary: 'Modifier un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Devis mis a jour' })
  async updateQuote(@Param('id') id: string, @Body() dto: Partial<CreateQuoteDto>, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateQuote(id, dto);
  }

  @Delete('quotes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un devis' })
  @ApiParam({ name: 'id', description: 'ID du devis' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Devis supprime' })
  async deleteQuote(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteQuote(id);
  }

  // === FACTURES ===

  @Get('invoices')
  @ApiOperation({ summary: 'Lister les factures depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async getInvoices(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInvoices();
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Details d une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Facture trouvee' })
  async getInvoiceById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getInvoiceById(id);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une facture' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Facture creee' })
  async createInvoice(@Body() dto: CreateInvoiceDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createInvoice(dto);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Modifier une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Facture mise a jour' })
  async updateInvoice(@Param('id') id: string, @Body() dto: Partial<CreateInvoiceDto>, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateInvoice(id, dto);
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une facture' })
  @ApiParam({ name: 'id', description: 'ID de la facture' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Facture supprimee' })
  async deleteInvoice(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteInvoice(id);
  }

  // === PAIEMENTS ===

  @Get('payments')
  @ApiOperation({ summary: 'Lister les paiements depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des paiements' })
  async getPayments(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPayments();
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Details d un paiement' })
  @ApiParam({ name: 'id', description: 'ID du paiement' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Paiement trouve' })
  async getPaymentById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPaymentById(id);
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Paiement enregistre' })
  async createPayment(@Body() dto: CreatePaymentDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createPayment(dto);
  }

  // === ENTREPOTS ===

  @Get('warehouses')
  @ApiOperation({ summary: 'Lister les entrepots depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des entrepots' })
  async getWarehouses(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getWarehouses();
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Details d un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Entrepot trouve' })
  async getWarehouseById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getWarehouseById(id);
  }

  @Post('warehouses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un entrepot' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Entrepot cree' })
  async createWarehouse(@Body() dto: CreateWarehouseDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createWarehouse(dto);
  }

  @Put('warehouses/:id')
  @ApiOperation({ summary: 'Modifier un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Entrepot mis a jour' })
  async updateWarehouse(@Param('id') id: string, @Body() dto: CreateWarehouseDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateWarehouse(id, dto);
  }

  @Delete('warehouses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un entrepot' })
  @ApiParam({ name: 'id', description: 'ID de lentrepot' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Entrepot supprime' })
  async deleteWarehouse(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteWarehouse(id);
  }

  // === EXPEDITIONS ===

  @Get('shipments')
  @ApiOperation({ summary: 'Lister les expeditions depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des expeditions' })
  async getShipments(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getShipments();
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Details d une expedition' })
  @ApiParam({ name: 'id', description: 'ID de lexpedition' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Expedition trouvee' })
  async getShipmentById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getShipmentById(id);
  }

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer une expedition' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Expedition creee' })
  async createShipment(@Body() dto: CreateShipmentDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createShipment(dto);
  }

  @Put('shipments/:id')
  @ApiOperation({ summary: 'Modifier une expedition' })
  @ApiParam({ name: 'id', description: 'ID de lexpedition' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Expedition mise a jour' })
  async updateShipment(@Param('id') id: string, @Body() dto: Partial<CreateShipmentDto>, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateShipment(id, dto);
  }

  // === DOCUMENTS ===

  @Get('documents')
  @ApiOperation({ summary: 'Lister les documents depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des documents' })
  async getDocuments(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getDocuments();
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Details d un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Document trouve' })
  async getDocumentById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getDocumentById(id);
  }

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un document' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Document cree' })
  async createDocument(@Body() dto: CreateDocumentDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createDocument(dto);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un document' })
  @ApiParam({ name: 'id', description: 'ID du document' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 204, description: 'Document supprime' })
  async deleteDocument(@Param('id') id: string, @Query('erp') erpCode = 'MOCK'): Promise<void> {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteDocument(id);
  }

  // === MOUVEMENTS DE STOCK ===

  @Get('stock-movements')
  @ApiOperation({ summary: 'Lister les mouvements de stock depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des mouvements de stock' })
  async getStockMovements(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStockMovements();
  }

  @Post('stock-movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un mouvement de stock' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Mouvement cree' })
  async createStockMovement(@Body() dto: CreateStockMovementDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createStockMovement(dto);
  }

  // === ACHATS (bons de commande fournisseurs) ===

  @Get('purchases')
  @ApiOperation({ summary: 'Lister les achats depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des achats' })
  async getPurchaseOrders(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPurchaseOrders();
  }

  @Get('purchases/:id')
  @ApiOperation({ summary: 'Details d un achat' })
  @ApiParam({ name: 'id', description: 'ID de l achat' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Achat trouve' })
  async getPurchaseOrderById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getPurchaseOrderById(id);
  }

  @Post('purchases')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un achat' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Achat cree' })
  async createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createPurchaseOrder(dto);
  }

  @Put('purchases/:id')
  @ApiOperation({ summary: 'Mettre a jour un achat' })
  @ApiParam({ name: 'id', description: 'ID de l achat' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Achat mis a jour' })
  async updatePurchaseOrder(@Param('id') id: string, @Body() dto: CreatePurchaseOrderDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updatePurchaseOrder(id, dto);
  }

  // === PROJETS ===

  @Get('projects')
  @ApiOperation({ summary: 'Lister les projets depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des projets' })
  async getProjects(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProjects();
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Details d un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Projet trouve' })
  async getProjectById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getProjectById(id);
  }

  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un projet' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Projet cree' })
  async createProject(@Body() dto: CreateProjectDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createProject(dto);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Mettre a jour un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Projet mis a jour' })
  async updateProject(@Param('id') id: string, @Body() dto: CreateProjectDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateProject(id, dto);
  }

  // === AGENDA ===

  @Get('agenda')
  @ApiOperation({ summary: 'Lister les evenements d agenda depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des evenements' })
  async getAgenda(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getAgenda();
  }

  @Post('agenda')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un evenement d agenda' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 201, description: 'Evenement cree' })
  async createAgendaEvent(@Body() dto: CreateAgendaEventDto, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.createAgendaEvent(dto);
  }

  @Put('agenda/:id')
  @ApiOperation({ summary: 'Modifier un evenement d agenda' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Evenement modifie' })
  async updateAgendaEvent(@Param('id') id: string, @Body() dto: Partial<CreateAgendaEventDto>, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.updateAgendaEvent(id, dto);
  }

  @Delete('agenda/:id')
  @ApiOperation({ summary: 'Supprimer un evenement d agenda' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Evenement supprime' })
  async deleteAgendaEvent(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    await adapter.deleteAgendaEvent(id);
    return { success: true, id };
  }

  // === UTILISATEURS ===

  @Get('users')
  @ApiOperation({ summary: 'Lister les utilisateurs depuis un ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  async getUsers(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getUsers();
  }

  @Get('users/me')
  @ApiOperation({ summary: 'Utilisateur courant (proprietaire de la cle API)' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Utilisateur courant' })
  async getCurrentUser(@Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getCurrentUser();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Details d un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l utilisateur' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Utilisateur trouve' })
  async getUserById(@Param('id') id: string, @Query('erp') erpCode = 'MOCK') {
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getUserById(id);
  }

  // === STATISTIQUES ===

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  async getStats(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/stats?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.getStats();
  }

  // === SANTE ===

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Verifier la sante d un adaptateur ERP' })
  @ApiQuery({ name: 'erp', required: false })
  @ApiResponse({ status: 200, description: 'Etat de sante' })
  async healthCheck(@Query('erp') erpCode = 'MOCK') {
    this.logger.log(`GET /erp/health?erp=${erpCode}`);
    const adapter = this.adapterService.getAdapter(erpCode);
    return adapter.healthCheck();
  }
}
