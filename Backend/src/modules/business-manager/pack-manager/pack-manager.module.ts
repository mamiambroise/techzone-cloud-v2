import { Module } from '@nestjs/common';
import { PackManagerController } from './pack-manager.controller';
import { PackManagerService } from './pack-manager.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AuditService } from '../audit/audit.service';
import { ModulesController } from './modules/modules.controller';
import { ModulesService } from './modules/modules.service';
import { FeaturesController } from './features/features.controller';
import { FeaturesService } from './features/features.service';

@Module({
  controllers: [PackManagerController, DashboardController, ModulesController, FeaturesController],
  providers: [PackManagerService, DashboardService, AuditService, ModulesService, FeaturesService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
