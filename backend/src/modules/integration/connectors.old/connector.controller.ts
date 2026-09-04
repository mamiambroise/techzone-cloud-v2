import { Body, Controller, Get, Param, Post, Put, Patch } from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { CreateConnectorDto } from './dto/create-connector.dto';
import { UpdateConnectorDto } from './dto/update-connector.dto';
import { ValidateConnectorDto } from './dto/validate-connector.dto';

@Controller('api/integrations/connectors')
export class ConnectorController {
  constructor(private readonly connectorService: ConnectorService) {}

  @Get()
  async findAll() {
    return this.connectorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.connectorService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateConnectorDto) {
    return this.connectorService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateConnectorDto) {
    return this.connectorService.update(id, dto);
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string, @Body() dto: ValidateConnectorDto) {
    return this.connectorService.validate(id, dto.configuration);
  }

  @Post(':id/health')
  async healthCheck(@Param('id') id: string) {
    return this.connectorService.healthCheck(id);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.connectorService.activate(id);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    return this.connectorService.disable(id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.connectorService.archive(id);
  }
}
