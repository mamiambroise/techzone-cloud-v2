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

@Module({
  imports: [
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
  ],
  exports: [
    ApplicationService,
    VersionService,
    PublicationService,
    AuditService,
  ],
})
export class BusinessManagerModule { }