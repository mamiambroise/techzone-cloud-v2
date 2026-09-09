import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PackManagerController, DashboardController, ModulesController, FeaturesController],
  providers: [PackManagerService, DashboardService, AuditService, ModulesService, FeaturesService],
  exports: [PackManagerService],
})
export class PackManagerModule {}
