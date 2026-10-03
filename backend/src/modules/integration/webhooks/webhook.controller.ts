import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { RequirePermission } from '../../../iam/permission.decorator';
import {
  INTEGRATION_READ,
  INTEGRATION_WRITE,
} from '../../../iam/iam.constants';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/create-webhook.dto';

@Controller('api/integrations/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @RequirePermission(INTEGRATION_WRITE)
  async create(@Body() dto: CreateWebhookDto) {
    return this.webhookService.create(dto);
  }

  @Get()
  @RequirePermission(INTEGRATION_READ)
  async findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  @RequirePermission(INTEGRATION_READ)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.webhookService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhookService.update(id, dto);
  }

  @Post(':id/transition')
  @RequirePermission(INTEGRATION_WRITE)
  async transition(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('status') status: string,
  ) {
    return this.webhookService.transition(id, status);
  }

  @Delete(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.webhookService.remove(id);
  }
}