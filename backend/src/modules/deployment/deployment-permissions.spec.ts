import { PERMISSION_KEY } from '../../iam/permission.decorator';
import { TENANT_RESOURCE_KEY } from '../../iam/tenant-resource.decorator';
import { CockpitController } from './cockpit/cockpit.controller';
import { DeploymentController } from './deployments/deployment.controller';
import { EnvironmentDeploymentController } from './environments/environment-deployment.controller';
import { GateController } from './gates/gate.controller';
import { ReleaseController } from './release/release.controller';
import { RollbackController } from './rollback/rollback.controller';
import { DeploymentDiagnosticsController } from './diagnostics/deployment-diagnostics.controller';

describe('Deployment controller permissions', () => {
  it('requires an explicit permission for every route handler', () => {
    const controllers: object[] = [
      CockpitController.prototype,
      DeploymentController.prototype,
      EnvironmentDeploymentController.prototype,
      GateController.prototype,
      ReleaseController.prototype,
      RollbackController.prototype,
      DeploymentDiagnosticsController.prototype,
    ];

    for (const controller of controllers) {
      for (const name of Object.getOwnPropertyNames(controller)) {
        if (name === 'constructor') continue;

        const handler = Object.getOwnPropertyDescriptor(controller, name)?.value;
        if (typeof handler !== 'function') continue;

        expect(Reflect.getMetadata(PERMISSION_KEY, handler)).toEqual(
          expect.any(String),
        );
      }
    }
  });

  it('binds ID routes to their tenant-scoped resource', () => {
    expect(Reflect.getMetadata(TENANT_RESOURCE_KEY, DeploymentController)).toEqual(
      { table: 'deployment' },
    );
    expect(
      Reflect.getMetadata(TENANT_RESOURCE_KEY, EnvironmentDeploymentController),
    ).toEqual({ table: 'environment', idParam: 'environmentId' });
    expect(Reflect.getMetadata(TENANT_RESOURCE_KEY, GateController)).toEqual({
      table: 'deployment',
      idParam: 'id',
    });
    expect(Reflect.getMetadata(TENANT_RESOURCE_KEY, ReleaseController)).toEqual({
      table: 'release',
    });
    expect(
      Reflect.getMetadata(
        TENANT_RESOURCE_KEY,
        ReleaseController.prototype.compare,
      ),
    ).toEqual({ table: 'release', idParam: 'id1' });
    expect(
      Reflect.getMetadata(
        TENANT_RESOURCE_KEY,
        DeploymentDiagnosticsController,
      ),
    ).toEqual({ table: 'deployment', idParam: 'deploymentId' });
    expect(
      Reflect.getMetadata(
        TENANT_RESOURCE_KEY,
        RollbackController.prototype.rollbackDeployment,
      ),
    ).toEqual({ table: 'deployment', idParam: 'id' });
    expect(
      Reflect.getMetadata(
        TENANT_RESOURCE_KEY,
        RollbackController.prototype.rollbackEnvironment,
      ),
    ).toEqual({ table: 'environment', idParam: 'environmentId' });
  });
});
