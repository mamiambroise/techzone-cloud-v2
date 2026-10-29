import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async runAll(dryRun = true) {
    const policies = await this.prisma.observabilityRetentionPolicy.findMany({ where: { enabled: true } });
    return Promise.all(policies.map((policy) => this.run(policy.id, dryRun)));
  }

  async run(policyId: string, dryRun = true) {
    const policy = await this.prisma.observabilityRetentionPolicy.findUnique({ where: { id: policyId } });
    if (!policy) throw new Error('OBS_RETENTION_POLICY_NOT_FOUND');
    const run = await this.prisma.observabilityRetentionRun.create({ data: { policyId, dryRun, status: 'RUNNING' } });
    try {
      const before = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
      const where: any = { ...(policy.tenantId ? { tenantId: policy.tenantId } : {}) };
      let affected = 0;
      if (policy.signalType === 'AUDIT') {
        where.createdAt = { lt: before }; affected = await this.prisma.auditEvent.count({ where }); if (!dryRun) await this.prisma.auditEvent.deleteMany({ where });
      } else if (policy.signalType === 'SECURITY_EVENTS') {
        where.occurredAt = { lt: before }; affected = await this.prisma.securityEvent.count({ where }); if (!dryRun) await this.prisma.securityEvent.deleteMany({ where });
      } else if (policy.signalType === 'ALERTS') {
        where.resolvedAt = { lt: before }; affected = await this.prisma.observabilityAlert.count({ where }); if (!dryRun) await this.prisma.observabilityAlert.deleteMany({ where });
      } else if (policy.signalType === 'INCIDENTS') {
        where.resolvedAt = { lt: before }; affected = await this.prisma.observabilityIncident.count({ where }); if (!dryRun) await this.prisma.observabilityIncident.deleteMany({ where });
      } else if (policy.signalType === 'DIAGNOSTICS') {
        where.checkedAt = { lt: before }; affected = await this.prisma.platformDiagnostic.count({ where }); if (!dryRun) await this.prisma.platformDiagnostic.deleteMany({ where });
      } else if (policy.signalType === 'LOGS' || policy.signalType === 'TRACES') {
        where.timestamp = { lt: before }; affected = await this.prisma.observabilityLog.count({ where }); if (!dryRun) await this.prisma.observabilityLog.deleteMany({ where });
      } else if (policy.signalType === 'METRICS') {
        where.timestamp = { lt: before }; affected = await this.prisma.observabilityMetric.count({ where }); if (!dryRun) await this.prisma.observabilityMetric.deleteMany({ where });
      } else {
        return this.finish(run.id, 'UNAVAILABLE', 0, { reason: 'Signal storage is not persisted in PostgreSQL.' });
      }
      return this.finish(run.id, 'COMPLETED', affected, { before, archiveRequested: policy.archive, dryRun });
    } catch (error) {
      return this.finish(run.id, 'FAILED', 0, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private finish(id: string, status: string, affected: number, details: Record<string, unknown>) {
    return this.prisma.observabilityRetentionRun.update({ where: { id }, data: { status, affected, details: details as Prisma.InputJsonValue, completedAt: new Date() } });
  }
}
