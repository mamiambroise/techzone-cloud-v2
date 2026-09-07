import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CockpitController } from './cockpit/cockpit.controller';
import { CockpitService } from './cockpit/cockpit.service';
import { ReleaseController } from './release/release.controller';
import { ReleaseService } from './release/release.service';
import { DeploymentController } from './deployments/deployment.controller';
import { DeploymentService } from './deployments/deployment.service';
import { EnvironmentDeploymentController } from './environments/environment-deployment.controller';
import { EnvironmentDeploymentService } from './environments/environment-deployment.service';
import { GateController } from './gates/gate.controller';
import { GateService } from './gates/gate.service';
import { RollbackController } from './rollback/rollback.controller';
import { RollbackService } from './rollback/rollback.service';
import { DeploymentDiagnosticsController } from './diagnostics/deployment-diagnostics.controller';
import { DeploymentDiagnosticsService } from './diagnostics/deployment-diagnostics.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CockpitController,
    ReleaseController,
    DeploymentController,
    EnvironmentDeploymentController,
    GateController,
    RollbackController,
    DeploymentDiagnosticsController,
  ],
  providers: [
    CockpitService,
    ReleaseService,
    DeploymentService,
    EnvironmentDeploymentService,
    GateService,
    RollbackService,
    DeploymentDiagnosticsService,
  ],
  exports: [
    CockpitService,
    ReleaseService,
    DeploymentService,
    EnvironmentDeploymentService,
    GateService,
    RollbackService,
    DeploymentDiagnosticsService,
  ],
})
export class DeploymentModule {}
