import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';

export interface DeploymentErrorContract {
  readonly code: DeploymentErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: string;
}
