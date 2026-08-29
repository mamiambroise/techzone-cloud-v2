import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums';

@ApiTags('Activity')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications/:applicationId/activity')
@UseGuards(AuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Consulter l\'historique d\'une application' })
  @ApiResponse({ status: 200, description: 'Historique' })
  @ApiResponse({ status: 404, description: 'Application non trouvée' })
  async getActivity(
    @Param('applicationId') applicationId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.auditService.getActivity(applicationId, query);
  }

  @Get('recent')
  @Permissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Activité récente' })
  @ApiResponse({ status: 200, description: 'Activité récente' })
  async getRecentActivity(@Param('applicationId') applicationId: string) {
    return this.auditService.getRecentActivity(applicationId, 10);
  }
}