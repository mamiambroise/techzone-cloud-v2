export class PlatformDashboardDto {
  status!: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

  kpis!: {
    applications: number;
    activeVersions: number;
    environments: number;
    activeContracts: number;
    invalidConfigurations: number;
    recentSnapshots: number;
  };

  applications!: {
    total: number;
    active: number;
    archived: number;
  };

  versions!: {
    total: number;
    active: number;
    ready: number;
    draft: number;
  };

  environments!: {
    total: number;
    active: number;
    maintenance: number;
    degraded: number;
    disabled: number;
  };

  contracts!: {
    total: number;
    active: number;
    locked: number;
    deprecated: number;
    retired: number;
  };

  configurations!: {
    total: number;
    active: number;
    invalid: number;
    draft: number;
    ready: number;
  };

  snapshots!: {
    total: number;
    active: number;
    valid: number;
    invalid: number;
    recent: number;
  };

  alerts!: Array<{
    type: 'WARNING' | 'ERROR';
    resource: string;
    message: string;
  }>;
}
