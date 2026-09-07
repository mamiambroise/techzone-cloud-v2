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
import { RuntimeController } from './runtime/runtime.controller';
import { RuntimeResolverService, RUNTIME_PROVIDERS } from './runtime/runtime-resolver.service';
import { CapabilityDependencyResolverService, RUNTIME_CAPABILITY_AVAILABILITY_PROVIDER } from './runtime/capability-dependency-resolver.service';
import { RUNTIME_MANIFEST_PROVIDER, RuntimeResolutionService } from './runtime/runtime-resolution.service';
import { PackManifestProvider } from './runtime/providers/pack-manifest.provider';
import {
  MockApplicationContextProvider,
  MockCapabilityProvider,
  MockEntitlementProvider,
  MockIamContextProvider,
} from './runtime/providers/mock-runtime.providers';
import { RuntimeCockpitController } from './runtime/cockpit/cockpit.controller';
import { RuntimeCockpitService } from './runtime/cockpit/cockpit.service';
import { PackManagerModule } from './pack-manager/pack-manager.module';

@Module({
  imports: [
    PackManagerModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
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
    RuntimeController,
    QualityController,
    RuntimeCockpitController,
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
    RuntimeResolverService,
    CapabilityDependencyResolverService,
    RuntimeResolutionService,
    PackManifestProvider,
    { provide: RUNTIME_MANIFEST_PROVIDER, useExisting: PackManifestProvider },
    MockApplicationContextProvider,
    MockIamContextProvider,
    MockEntitlementProvider,
    MockCapabilityProvider,
    QualityService,
    RuntimeCockpitService,
    {
      provide: RUNTIME_PROVIDERS.application,
      useExisting: MockApplicationContextProvider,
    },
    {
      provide: RUNTIME_PROVIDERS.iam,
      useExisting: MockIamContextProvider,
    },
    {
      provide: RUNTIME_PROVIDERS.entitlement,
      useExisting: MockEntitlementProvider,
    },
    {
      provide: RUNTIME_PROVIDERS.capability,
      useExisting: MockCapabilityProvider,
    },
    {
      provide: RUNTIME_CAPABILITY_AVAILABILITY_PROVIDER,
      useExisting: MockCapabilityProvider,
    },
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
    RuntimeResolverService,
    RuntimeResolutionService,
    QualityService,
  ],
})
export class BusinessManagerModule { }
