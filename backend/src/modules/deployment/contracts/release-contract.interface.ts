export interface ReleaseContract {
  readonly id: string;
  readonly code: string;
  readonly version: string;
  readonly applicationId: string;
  readonly applicationVersionId: string;
  readonly snapshotId: string;
  readonly artifactRefs: Record<string, unknown>;
  readonly contractVersions: Record<string, string>;
  readonly configurationVersion: string;
  readonly status: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly approvedAt?: Date | null;
  readonly releasedAt?: Date | null;

  validateImmutability(): boolean;
  verifyArtifacts(): Promise<boolean>;
}
