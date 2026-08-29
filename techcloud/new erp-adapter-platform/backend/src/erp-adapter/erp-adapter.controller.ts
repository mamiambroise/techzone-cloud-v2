import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ErpAdapterService } from './erp-adapter.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateOrderDto } from './dto/create-order.dto';

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

  // === SANTE ===

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
