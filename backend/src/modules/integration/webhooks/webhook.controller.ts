import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/create-webhook.dto';

@Controller('api/integrations/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async create(@Body() dto: CreateWebhookDto) {
    return this.webhookService.create(dto);
  }

  @Get()
  async findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.webhookService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhookService.update(id, dto);
  }

  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.webhookService.transition(id, status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.webhookService.remove(id);
  }
}
