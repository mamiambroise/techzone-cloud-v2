export interface DeploymentContract {
  readonly id: string;
  readonly releaseId: string;
  readonly environmentId: string;
  readonly status: string;
  readonly strategy: 'STANDARD' | 'ROLLING' | 'BLUE_GREEN' | 'CANARY';
  readonly idempotencyKey?: string | null;
  readonly startedBy: string;
  readonly startedAt: Date;
  readonly finishedAt?: Date | null;
  readonly healthStatus?: string | null;
  readonly traceId?: string | null;

  canExecute(environmentState: { isLocked: boolean; activeDeployments: number }): boolean;
  executeHealthCheck(): Promise<{ healthy: boolean; details?: string }>;
}
