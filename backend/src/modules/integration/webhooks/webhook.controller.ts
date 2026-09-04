import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto, WebhookDirectionEnum } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { DispatchWebhookDto } from './dto/dispatch-webhook.dto';

@Controller('api/integrations/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async create(@Body() dto: CreateWebhookDto) {
    return this.webhookService.create(dto);
  }

  @Get()
  async findAll(
    @Query('direction') direction?: WebhookDirectionEnum,
    @Query('event') event?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.webhookService.findAll({
      direction,
      event,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.webhookService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.update(id, dto);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.webhookService.activate(id);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    return this.webhookService.disable(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.webhookService.archive(id);
  }

  @Post(':id/dispatch')
  async dispatch(
    @Param('id') id: string,
    @Body() dto: DispatchWebhookDto,
  ) {
    return this.webhookService.dispatchOutbound(id, dto);
  }

  @Post('inbound/:code')
  async receiveInbound(
    @Param('code') code: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.webhookService.processInbound(code, payload, headers);
  }

  @Get(':id/deliveries')
  async getDeliveries(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.webhookService.getDeliveries(id, page, limit);
  }

  @Get('deliveries/:deliveryId')
  async getDelivery(@Param('deliveryId') deliveryId: string) {
    return this.webhookService.getDelivery(deliveryId);
  }

  @Post('deliveries/:deliveryId/retry')
  async retryDelivery(@Param('deliveryId') deliveryId: string) {
    return this.webhookService.retryDelivery(deliveryId);
  }
}
