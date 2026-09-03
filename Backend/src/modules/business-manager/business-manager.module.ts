import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ApplicationController } from './applications/application.controller';
import { ApplicationService } from './applications/application.service';

import { LifecycleController } from './lifecycle/lifecycle.controller';
import { LifecycleService } from './lifecycle/lifecycle.service';

import { VersionController } from './versions/version.controller';
import { VersionService } from './versions/version.service';

import { ValidationController } from './validation/validation.controller';
import { ValidationService } from './validation/validation.service';

import { PublicationController } from './publication/publication.controller';
import { PublicationService } from './publication/publication.service';

import { RollbackController } from './rollback/rollback.controller';
import { RollbackService } from './rollback/rollback.service';

import { CloneService } from './clone/clone.service';

import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';

import { DataModelController } from './data-model/data-model.controller';
import { DataModelService } from './data-model/data-model.service';

import { FeatureCapabilityController } from './feature-capability/feature-capability.controller';
import { FeatureCapabilityService } from './feature-capability/feature-capability.service';
import { MenuController } from './menus/menu.controller';
import { MenuService } from './menus/menu.service';
import { ConfigurationController } from './configuration/configuration.controller';
import { ConfigurationService } from './configuration/configuration.service';
import { RuntimeBridgeController } from './runtime/runtime-bridge.controller';
import { RuntimeBridgeService } from './runtime/runtime-bridge.service';
import { QualityController } from './quality/quality.controller';
import { QualityService } from './quality/quality.service';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('app.jwtSecret', 'super-secret-key-change-me'),
        signOptions: {
          expiresIn: configService.get('app.jwtExpiresIn', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    ApplicationController,
    LifecycleController,
    VersionController,
    ValidationController,
    PublicationController,
    RollbackController,
    AuditController,
    DataModelController,
    FeatureCapabilityController,
    MenuController,
    ConfigurationController,
    RuntimeBridgeController,
    QualityController,
  ],
  providers: [
    ApplicationService,
    LifecycleService,
    VersionService,
    ValidationService,
    PublicationService,
    RollbackService,
    CloneService,
    AuditService,
    DataModelService,
    FeatureCapabilityService,
    MenuService,
    ConfigurationService,
    RuntimeBridgeService,
    QualityService,
  ],
  exports: [
    ApplicationService,
    VersionService,
    PublicationService,
    AuditService,
    DataModelService,
    FeatureCapabilityService,
    MenuService,
    ConfigurationService,
    RuntimeBridgeService,
    QualityService,
  ],
})
export class BusinessManagerModule { }
