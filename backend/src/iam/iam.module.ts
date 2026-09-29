import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';
import { IamAuthService } from './iam-auth.service';
import { IamAdminService } from './iam-admin.service';
import { IamJwtGuard } from './iam-jwt.guard';
import { IamPermissionGuard } from './iam-permission.guard';
import { IamPermissionsGuard } from './iam-permissions.guard';
import { TenantGuard } from './tenant.guard';
import { IamAdminUsersController } from './iam-admin-users.controller';
import { IamAuthController } from './iam-auth.controller';
import { IamUsersController } from './iam-users.controller';
import { IamSessionsController } from './iam-sessions.controller';
import { IamProfileController } from './iam-profile.controller';
import { IamGovernanceController } from './iam-governance.controller';
import { IamGovernanceService } from './iam-governance.service';
import { IamPoliciesController } from './iam-policies.controller';
import { IamPoliciesService } from './iam-policies.service';
import { IamTenantsController } from './iam-tenants.controller';
import { IamTenantsService } from './iam-tenants.service';
import { IamIdentitiesController } from './iam-identities.controller';
import { IamIdentityService } from './iam-identity.service';
import { IamMfaController } from './iam-mfa.controller';
import { IamMfaService } from './iam-mfa.service';
import { IamObservabilityController } from './iam-observability.controller';
import { IamObservabilityService } from './iam-observability.service';
import { IamConfigController } from './iam-config.controller';
import { IamConfigService } from './iam-config.service';
import { IamContextService } from './iam-context.service';
import { IamContextController } from './iam-context.controller';
import { IamHealthController } from './iam-health.controller';
import { IamBillingController } from './iam-billing.controller';
import { IamBillingService } from './iam-billing.service';
import { IamAdminGuard } from './iam-admin-guard';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [
    IamAdminUsersController,
    IamAuthController,
    IamUsersController,
    IamSessionsController,
    IamProfileController,
    IamGovernanceController,
    IamPoliciesController,
    IamTenantsController,
    IamIdentitiesController,
    IamMfaController,
    IamObservabilityController,
    IamConfigController,
    IamContextController,
    IamHealthController,
    IamBillingController,
  ],
  providers: [
    IamAuthService,
    IamAdminService,
    IamGovernanceService,
    IamPoliciesService,
    IamTenantsService,
    IamIdentityService,
    IamMfaService,
    IamObservabilityService,
    IamConfigService,
    IamContextService,
    IamBillingService,
    IamJwtGuard,
    IamAdminGuard,
    IamPermissionGuard,
    IamPermissionsGuard,
    {
      provide: APP_GUARD,
      useClass: IamJwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IamPermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IamPermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [IamAuthService, IamContextService, IamAdminService, IamMfaService],
})
export class IamModule {}
