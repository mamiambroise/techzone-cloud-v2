import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConnectorService } from './connector.service';
import { RequirePermission } from '../../../iam/permission.decorator';
import {
  INTEGRATION_READ,
  INTEGRATION_WRITE,
  INTEGRATION_EXECUTE,
} from '../../../iam/iam.constants';
import { CreateConnectorDto } from './dto/create-connector.dto';
import { UpdateConnectorDto } from './dto/update-connector.dto';
import { ValidateConnectorDto } from './dto/validate-connector.dto';

@Controller('api/integrations/connectors')
export class ConnectorController {
  constructor(private readonly connectorService: ConnectorService) {}

  @Get()
  @RequirePermission(INTEGRATION_READ)
  async findAll() {
    return this.connectorService.findAll();
  }

  @Get(':id')
  @RequirePermission(INTEGRATION_READ)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.connectorService.findOne(id);
  }

  @Post()
  @RequirePermission(INTEGRATION_WRITE)
  async create(@Body() dto: CreateConnectorDto) {
    return this.connectorService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(INTEGRATION_WRITE)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateConnectorDto,
  ) {
    return this.connectorService.update(id, dto);
  }

  @Post(':id/validate')
  @RequirePermission(INTEGRATION_EXECUTE)
  async validate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ValidateConnectorDto,
  ) {
    return this.connectorService.validate(id, dto.configuration);
  }

  @Post(':id/health')
  @RequirePermission(INTEGRATION_EXECUTE)
  async healthCheck(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.connectorService.healthCheck(id);
  }

  @Post(':id/activate')
  @RequirePermission(INTEGRATION_WRITE)
  async activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.connectorService.activate(id);
  }

  @Post(':id/disable')
  @RequirePermission(INTEGRATION_WRITE)
  async disable(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.connectorService.disable(id);
  }

  @Post(':id/archive')
  @RequirePermission(INTEGRATION_WRITE)
  async archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.connectorService.archive(id);
  }
}