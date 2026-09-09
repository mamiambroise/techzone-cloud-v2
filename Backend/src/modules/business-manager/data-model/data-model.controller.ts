import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import type { CreateDataModelDto } from './data-model.service';
import { DataModelService } from './data-model.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { User } from '../../../common/decorators/user.decorator';
import type { UserContext } from '../../../common/decorators/user.decorator';
import { Permission } from '../../../common/enums';

@ApiTags('Data Models')
@ApiBearerAuth()
@Controller('api/v1/business-manager/applications/:applicationId/versions/:versionId/models')
@UseGuards(AuthGuard, PermissionGuard)
export class DataModelController {
    constructor(private readonly dataModelService: DataModelService) { }

    @Post()
    @Permissions(Permission.DATA_MODEL_WRITE)
    @ApiOperation({ summary: 'Créer un modèle de données' })
    @ApiResponse({ status: 201, description: 'Modèle créé' })
    async create(
        @Param('applicationId') applicationId: string,
        @Param('versionId') versionId: string,
        @Body() dto: CreateDataModelDto,
        @User() user: UserContext,
    ) {
        return this.dataModelService.createForVersion(applicationId, versionId, dto, user.id);
    }

    @Get()
    @Permissions(Permission.DATA_MODEL_READ)
    @ApiOperation({ summary: 'Lister les modèles de données' })
    async findAll(
        @Param('applicationId') applicationId: string,
        @Param('versionId') versionId: string,
    ) {
        return this.dataModelService.findByVersion(applicationId, versionId);
    }

    @Get(':modelId')
    @Permissions(Permission.DATA_MODEL_READ)
    @ApiOperation({ summary: 'Obtenir un modèle de données' })
    async findById(@Param('modelId') modelId: string) {
        return this.dataModelService.findById(modelId);
    }

    @Post(':modelId/validate')
    @Permissions(Permission.DATA_MODEL_VALIDATE)
    @ApiOperation({ summary: 'Valider le modèle de données' })
    async validate(@Param('modelId') modelId: string) {
        return this.dataModelService.validateSchema(modelId);
    }

    @Get(':modelId/dependencies')
    @Permissions(Permission.DATA_MODEL_READ)
    @ApiOperation({ summary: 'Graphe de dépendances du modèle' })
    async dependencies(@Param('modelId') modelId: string) {
        return this.dataModelService.getDependencyGraph(modelId);
    }

    @Get(':modelId/impact')
    @Permissions(Permission.DATA_MODEL_READ)
    @ApiOperation({ summary: 'Analyse d’impact sur un champ' })
    async impact(
        @Param('modelId') modelId: string,
        @Query('field') fieldName: string,
    ) {
        return this.dataModelService.getImpactAnalysis(modelId, fieldName);
    }
}
