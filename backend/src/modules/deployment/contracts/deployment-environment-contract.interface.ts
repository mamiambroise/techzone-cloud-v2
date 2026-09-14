export interface DeploymentEnvironmentContract {
  readonly environmentId: string;
  readonly environmentCode: string;
  readonly environmentType: 'DEVELOPMENT' | 'TEST' | 'STAGING' | 'PRODUCTION';
  readonly isLocked: boolean;
  readonly currentReleaseId?: string | null;
  readonly previousReleaseId?: string | null;
  readonly healthStatus?: string | null;

  canPromoteTo(nextStage: 'TEST' | 'STAGING' | 'PRODUCTION'): boolean;
  detectDrift(expectedHash: string, currentHash: string): boolean;
}
