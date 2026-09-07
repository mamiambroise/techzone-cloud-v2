export type RollbackType =
  | 'MANUAL_ROLLBACK'
  | 'AUTOMATIC_ROLLBACK'
  | 'REDEPLOY_PREVIOUS';

export type RollbackStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface RollbackContract {
  readonly id: string;
  readonly deploymentId: string;
  readonly fromReleaseId: string;
  readonly toReleaseId: string;
  readonly type: RollbackType;
  readonly reason: string;
  readonly status: RollbackStatus;
  readonly startedBy: string;
  readonly startedAt: Date;
  readonly finishedAt?: Date | null;
  readonly traceId?: string | null;

  verifyTargetReadiness(): Promise<boolean>;
  executeRollback(): Promise<{ success: boolean; error?: string }>;
}
