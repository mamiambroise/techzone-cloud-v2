import { Injectable } from '@nestjs/common';

import { ApplicationsService } from '../platform/applications/applications.service';
import { ApplicationVersionsService } from './application-versions/application-versions.service';
import { EnvironmentsService } from '../platform/environments/environment.service';
import { ContractsService } from '../platform/contracts/contract.service';
import { ConfigurationService } from '../platform/configuration/configuration.service';
import { SnapshotsService } from '../platform/snapshots/snapshot.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly applicationVersionsService: ApplicationVersionsService,
    private readonly environmentsService: EnvironmentsService,
    private readonly contractsService: ContractsService,
    private readonly configurationService: ConfigurationService,
    private readonly snapshotsService: SnapshotsService,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard() {
    const [
      applications,
      versions,
      environments,
      contracts,
      configurations,
      snapshots,
    ] = await Promise.all([
      this.applicationsService.findAll(),
      this.applicationVersionsService.findAll(),
      this.environmentsService.findAll(),
      this.contractsService.findAll(),
      this.configurationService.findAll(),
      this.snapshotsService.findAll(),
    ]);

    const activeVersions = versions.filter(
      (version) => version.status === 'ACTIVE',
    ).length;

    const activeContracts = contracts.filter(
      (contract) => contract.status === 'ACTIVE',
    ).length;

    const activeEnvironments = environments.filter(
      (environment) => environment.status === 'ACTIVE',
    ).length;

    const activeSnapshots = snapshots.filter(
      (snapshot) => snapshot.status === 'ACTIVE',
    ).length;

    const validSnapshots = snapshots.filter(
      (snapshot) => snapshot.status === 'VALID',
    ).length;

    const invalidSnapshots = snapshots.filter(
      (snapshot) => snapshot.status === 'INVALID',
    ).length;

    /*
     * État global du cockpit.
     *
     * Pour l'instant :
     * - CRITICAL : configurations ou snapshots invalides
     * - DEGRADED : environnement dégradé
     * - WARNING  : environnement en maintenance
     * - HEALTHY  : aucun problème détecté
     */
    const hasCriticalIssue = invalidSnapshots > 0;

    const hasDegradedEnvironment = environments.some(
      (environment) => environment.status === 'DEGRADED',
    );

    const hasMaintenanceEnvironment = environments.some(
      (environment) => environment.status === 'MAINTENANCE',
    );

    let status: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL';

    if (hasCriticalIssue) {
      status = 'CRITICAL';
    } else if (hasDegradedEnvironment) {
      status = 'DEGRADED';
    } else if (hasMaintenanceEnvironment) {
      status = 'WARNING';
    } else {
      status = 'HEALTHY';
    }

    const alerts: Array<{
      type: 'WARNING' | 'ERROR';
      resource: string;
      message: string;
    }> = [];

    if (invalidSnapshots > 0) {
      alerts.push({
        type: 'ERROR',
        resource: 'SNAPSHOT',
        message: `${invalidSnapshots} snapshot(s) invalide(s).`,
      });
    }

    if (hasDegradedEnvironment) {
      alerts.push({
        type: 'ERROR',
        resource: 'ENVIRONMENT',
        message: 'Au moins un environnement est dégradé.',
      });
    }

    if (hasMaintenanceEnvironment) {
      alerts.push({
        type: 'WARNING',
        resource: 'ENVIRONMENT',
        message: 'Au moins un environnement est en maintenance.',
      });
    }

    return {
      status,

      kpis: {
        applications: applications.length,
        activeVersions,
        environments: environments.length,
        activeContracts,

        recentSnapshots: snapshots.length,
      },

      applications: {
        total: applications.length,
        active: applications.filter(
          (application) => application.status === 'ACTIVE',
        ).length,
        archived: applications.filter(
          (application) => application.status === 'ARCHIVED',
        ).length,
      },

      versions: {
        total: versions.length,
        active: activeVersions,
        ready: versions.filter((version) => version.status === 'READY').length,
        draft: versions.filter((version) => version.status === 'DRAFT').length,
      },

      environments: {
        total: environments.length,
        active: activeEnvironments,
        maintenance: environments.filter(
          (environment) => environment.status === 'MAINTENANCE',
        ).length,
        degraded: environments.filter(
          (environment) => environment.status === 'DEGRADED',
        ).length,
        disabled: environments.filter(
          (environment) => environment.status === 'DISABLED',
        ).length,
      },

      contracts: {
        total: contracts.length,
        active: activeContracts,
        locked: contracts.filter((contract) => contract.status === 'LOCKED')
          .length,
        deprecated: contracts.filter(
          (contract) => contract.status === 'DEPRECATED',
        ).length,
        retired: contracts.filter((contract) => contract.status === 'RETIRED')
          .length,
      },

      configurations: {
        total: configurations.length,
        active: configurations.filter(
          (configuration) => configuration.status === 'ACTIVE',
        ).length,

        draft: configurations.filter(
          (configuration) => configuration.status === 'DRAFT',
        ).length,
        ready: configurations.filter(
          (configuration) => configuration.status === 'READY',
        ).length,
      },

      snapshots: {
        total: snapshots.length,
        active: activeSnapshots,
        valid: validSnapshots,
        invalid: invalidSnapshots,
        recent: snapshots.length,
      },

      alerts,
    };
  }

  async getActivity(limit = 20) {
    const [
      configurationHistory,
      environmentHistory,
      contractHistory,
      snapshotHistory,
    ] = await Promise.all([
      this.prisma.configurationHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),

      this.prisma.environmentHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),

      this.prisma.contractHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),

      this.prisma.snapshotHistory.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
    ]);

    console.log({
      configurationHistory: configurationHistory.length,
      environmentHistory: environmentHistory.length,
      contractHistory: contractHistory.length,
      snapshotHistory: snapshotHistory.length,
    });

    const activities = [
      ...configurationHistory.map((item) => ({
        resource: 'CONFIGURATION',
        resourceId: item.configurationId,
        action: item.action,
        actor: item.actor,
        timestamp: item.createdAt,
      })),

      ...environmentHistory.map((item) => ({
        resource: 'ENVIRONMENT',
        resourceId: item.environmentId,
        action: item.action,
        actor: item.actor,
        timestamp: item.createdAt,
      })),

      ...contractHistory.map((item) => ({
        resource: 'CONTRACT',
        resourceId: item.contractId,
        action: item.action,
        actor: item.actor,
        timestamp: item.createdAt,
      })),

      ...snapshotHistory.map((item) => ({
        resource: 'SNAPSHOT',
        resourceId: item.snapshotId,
        action: item.action,
        actor: item.createdBy,
        timestamp: item.createdAt,
        traceId: item.traceId,
        reason: item.reason,
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);

    // return activities.sort(
    //   (a, b) =>
    //     new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    // );
  }
}
