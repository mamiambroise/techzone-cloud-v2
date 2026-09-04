import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PackManagerController } from './pack-manager.controller';
import { PackManagerService } from './pack-manager.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { AuditService } from '../audit/audit.service';
import { ModulesController } from './modules/modules.controller';
import { ModulesService } from './modules/modules.service';
import { FeaturesController } from './features/features.controller';
import { FeaturesService } from './features/features.service';
import { DependenciesController } from './dependencies/dependencies.controller';
import { DependenciesService } from './dependencies/dependencies.service';
import { RulesController } from './rules/rules.controller';
import { RulesService } from './rules/rules.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('app.jwtSecret', 'super-secret-key-change-me'),
        signOptions: {
          expiresIn: configService.get('app.jwtExpiresIn', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PackManagerController, DashboardController, ModulesController, FeaturesController, DependenciesController, RulesController],
  providers: [PackManagerService, DashboardService, AuditService, ModulesService, FeaturesService, DependenciesService, RulesService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
