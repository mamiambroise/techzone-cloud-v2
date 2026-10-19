import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { DeploymentDiagnosticsController } from './deployment-diagnostics.controller';

const principal: IamAuthContext = {
  userId: 'diagnostics-user',
  sessionId: 'diagnostics-session',
  tenantId: 'tenant-a',
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
};

describe('DeploymentDiagnosticsController', () => {
  it('forwards the IAM principal to every diagnostics operation', () => {
    const diagnosticsService = {
      getHistory: jest.fn(),
      getTimeline: jest.fn(),
      getDiagnostics: jest.fn(),
      getDeploymentDiagnostic: jest.fn(),
    };
    const controller = new DeploymentDiagnosticsController(
      diagnosticsService as any,
    );

    controller.getHistory({ deploymentId: 'deployment-a' }, principal);
    controller.getTimeline('deployment-a', principal);
    controller.getDiagnostics(principal);
    controller.getDeploymentDiagnostic('deployment-a', principal);

    expect(diagnosticsService.getHistory).toHaveBeenCalledWith(
      { deploymentId: 'deployment-a' },
      principal,
    );
    expect(diagnosticsService.getTimeline).toHaveBeenCalledWith(
      'deployment-a',
      principal,
    );
    expect(diagnosticsService.getDiagnostics).toHaveBeenCalledWith(principal);
    expect(diagnosticsService.getDeploymentDiagnostic).toHaveBeenCalledWith(
      'deployment-a',
      principal,
    );
  });
});
