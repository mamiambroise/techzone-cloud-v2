import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  hasPermission,
  type IamPrincipal,
} from '../../iam/principal.decorator';

export type Widget = {
  state: 'LOADED' | 'EMPTY' | 'ERROR' | 'FORBIDDEN' | 'UNAVAILABLE';
  data: unknown;
  code?: string;
};
const unavailable = (code: string): Widget => ({
  state: 'UNAVAILABLE',
  data: null,
  code,
});

/** Read-only projections of owner data. No dashboard-owned business state or cache. */
@Injectable()
export class DashboardService {
  constructor(private readonly db: PrismaService) {}

  private tenant(actor: IamPrincipal) {
    if (!actor.tenantId || actor.tenantId === 'legacy')
      throw new ForbiddenException('TENANT_REQUIRED');
    return actor.tenantId;
  }

  async widget(
    actor: IamPrincipal,
    permission: string | null,
    read: () => Promise<unknown>,
  ): Promise<Widget> {
    if (permission && !hasPermission(actor, permission))
      return { state: 'FORBIDDEN', data: null };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const data = await Promise.race([
        Promise.resolve().then(read),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('SOURCE_TIMEOUT')), 4500);
        }),
      ]);
      return {
        state: Array.isArray(data) && data.length === 0 ? 'EMPTY' : 'LOADED',
        data,
      };
    } catch (error) {
      const code = (error as { code?: string }).code;
      return {
        state: 'ERROR',
        data: null,
        code: ['P1001', 'P1002', 'P1017'].includes(code ?? '')
          ? 'DATABASE_UNAVAILABLE'
          : 'SOURCE_UNAVAILABLE',
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  async getDashboard(actor: IamPrincipal, only?: string) {
    const tenantId = this.tenant(actor),
      where = { tenantId };
    const jobs: Record<string, () => Promise<Widget>> = {
      applications: () =>
        this.widget(actor, null, () => this.db.application.count({ where })),
      packs: () =>
        this.widget(actor, 'pack.read', () =>
          this.db.pmPack.count({ where: { ...where, archivedAt: null } }),
        ),
      deployments: () =>
        this.widget(actor, null, () => this.db.deployment.count({ where })),
      dataSources: async () =>
        hasPermission(actor, 'data-runtime:read')
          ? unavailable('DATA_SOURCE_CATALOG_NOT_AVAILABLE')
          : { state: 'FORBIDDEN', data: null },
      connectors: async () =>
        hasPermission(actor, 'erp:read')
          ? unavailable('TENANT_CONNECTOR_CATALOG_NOT_AVAILABLE')
          : { state: 'FORBIDDEN', data: null },
      recentPacks: () =>
        this.widget(actor, 'pack.read', async () => {
          const packs = await this.db.pmPack.findMany({
            where: { ...where, archivedAt: null },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              status: true,
              updatedAt: true,
              versions: {
                where,
                take: 1,
                orderBy: { updatedAt: 'desc' },
                select: {
                  id: true,
                  versionNumber: true,
                  status: true,
                  _count: {
                    select: {
                      modules: { where },
                    },
                  },
                },
              },
            },
          });
          return packs.map((pack) => ({
            id: pack.id,
            name: pack.name,
            status: pack.versions[0]?.status ?? pack.status,
            version: pack.versions[0]?.versionNumber ?? null,
            modules: pack.versions[0]?._count.modules ?? null,
            updatedAt: pack.updatedAt,
            targetRoute: `/packs/versions?pack=${pack.id}${pack.versions[0] ? '&version=' + pack.versions[0].id : ''}`,
          }));
        }),
      environments: () =>
        this.widget(actor, null, async () => {
          const rows = await this.db.environment.findMany({
            where,
            take: 6,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              deployments: {
                where,
                take: 1,
                orderBy: { startedAt: 'desc' },
                select: { status: true, startedAt: true, healthStatus: true },
              },
            },
          });
          return rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            status: row.status,
            lastDeployment: row.deployments[0] ?? null,
            targetRoute: '/environments',
          }));
        }),
      activity: () =>
        this.widget(actor, null, async () => {
          const prefixes = ['application.', 'business.', 'bm.'];
          if (hasPermission(actor, 'pack.read')) prefixes.push('pack.');
          if (hasPermission(actor, 'runtime.resolution.read'))
            prefixes.push('runtime.');
          const events = await this.db.auditEvent.findMany({
            where: {
              ...where,
              OR: prefixes.map((startsWith) => ({ action: { startsWith } })),
            },
            take: 6,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              action: true,
              targetType: true,
              result: true,
              createdAt: true,
            },
          });
          return events.map((event) => ({
            ...event,
            targetRoute: event.action.startsWith('pack.')
              ? '/packs'
              : event.action.startsWith('runtime.')
                ? '/runtime/diagnostics'
                : '/business-manager',
          }));
        }),
      businessAlerts: () =>
        this.widget(actor, null, async () => {
          const rows = await this.db.bmqQualityReport.findMany({
            where: { ...where, gateResult: 'FAIL' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              applicationId: true,
              applicationVersionId: true,
              updatedAt: true,
            },
          });
          return rows.map((row) => ({
            id: row.id,
            severity: 'ERROR',
            message: `Validation métier : ${row.name}`,
            timestamp: row.updatedAt,
            targetRoute: `/business-manager/applications/${row.applicationId}/versions/${row.applicationVersionId}/validation`,
          }));
        }),
      packAlerts: () =>
        this.widget(actor, 'pack.read', async () => {
          const rows = await this.db.pmPackVersion.findMany({
            where: { ...where, validationStatus: 'INVALID' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              packId: true,
              versionNumber: true,
              updatedAt: true,
            },
          });
          return rows.map((row) => ({
            id: row.id,
            severity: 'ERROR',
            message: `Pack ${row.versionNumber} : validation à corriger`,
            timestamp: row.updatedAt,
            targetRoute: `/packs/validation?pack=${row.packId}&version=${row.id}`,
          }));
        }),
      runtimeAlerts: () =>
        this.widget(actor, 'runtime.diagnostic.read', async () => {
          const rows = await this.db.prRuntimeDiagnostic.findMany({
            where: {
              ...where,
              severity: { in: ['ERROR', 'CRITICAL', 'WARNING'] },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              severity: true,
              message: true,
              resolutionId: true,
              createdAt: true,
            },
          });
          return rows.map((row) => ({
            id: row.id,
            severity: row.severity,
            message: `Runtime : ${row.message}`,
            timestamp: row.createdAt,
            targetRoute:
              '/runtime/diagnostics' +
              (row.resolutionId ? '?resolution=' + row.resolutionId : ''),
          }));
        }),
      deploymentAlerts: () =>
        this.widget(actor, null, async () => {
          const rows = await this.db.deployment.findMany({
            where: { ...where, status: 'FAILED' },
            take: 5,
            orderBy: { startedAt: 'desc' },
            select: { id: true, startedAt: true },
          });
          return rows.map((row) => ({
            id: row.id,
            severity: 'ERROR',
            message: 'Déploiement échoué',
            timestamp: row.startedAt,
            targetRoute: '/deployment/diagnostics',
          }));
        }),
    };
    const keys = only && Object.hasOwn(jobs, only) ? [only] : Object.keys(jobs);
    const widgets = Object.fromEntries(
      await Promise.all(keys.map(async (key) => [key, await jobs[key]()])),
    );
    return { tenantId, generatedAt: new Date().toISOString(), widgets };
  }

  async search(actor: IamPrincipal, input = '') {
    const tenantId = this.tenant(actor),
      q = input.trim().slice(0, 80);
    if (q.length < 2) return { tenantId, groups: {} };
    const contains = { contains: q, mode: 'insensitive' as const };
    const [applications, packs, environments] = await Promise.all([
      this.widget(actor, null, async () =>
        (
          await this.db.application.findMany({
            where: { tenantId, name: contains },
            take: 5,
            select: { id: true, name: true },
          })
        ).map((r) => ({
          ...r,
          targetRoute: `/business-manager/applications/${r.id}`,
        })),
      ),
      this.widget(actor, 'pack.read', async () =>
        (
          await this.db.pmPack.findMany({
            where: { tenantId, name: contains, archivedAt: null },
            take: 5,
            select: { id: true, name: true },
          })
        ).map((r) => ({ ...r, targetRoute: `/packs/versions?pack=${r.id}` })),
      ),
      this.widget(actor, null, async () =>
        (
          await this.db.environment.findMany({
            where: { tenantId, name: contains },
            take: 5,
            select: { id: true, name: true },
          })
        ).map((r) => ({ ...r, targetRoute: '/environments' })),
      ),
    ]);
    return { tenantId, groups: { applications, packs, environments } };
  }
}
