export interface SynchronizationContract {
  readonly code: string;
  readonly direction: 'PULL' | 'PUSH' | 'BIDIRECTIONAL';
  readonly mode: 'FULL' | 'INCREMENTAL';

  resolveConflict(sourceRecord: unknown, targetRecord: unknown, policy: string): unknown;
  generateCheckpoint(lastRecord: unknown, count: number): Record<string, unknown>;
}
