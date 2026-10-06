import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BillingDiagnosticStatus,
  BillingStage,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Diagnostics Billing (CDC 101) et Health Billing (CDC 102).
 *
 * Regle stricte : aucune donnee sensible n'est stockee ici. Ni secret provider,
 * ni reference de carte, ni payload de webhook brut, ni credential
 * (RG-BILL-031 / RG-BILL-032).
 */

export type BillingHealthStatus = 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export interface BillingHealthReport {
  billingProcess: BillingHealthReportEntry;
  billingDb: BillingHealthReportEntry;
  entitlementResolver: BillingHealthReportEntry;
  paymentProvider: BillingHealthReportEntry;
  webhookProcessing: BillingHealthReportEntry;
  erpSync: BillingHealthReportEntry;
}

export interface BillingHealthReportEntry {
  status: BillingHealthStatus;
  message: string;
  checkedAt: string;
}

@Injectable()
export class BillingDiagnosticsService {
  private readonly logger = new Logger(BillingDiagnosticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    stage: BillingStage;
    status: BillingDiagnosticStatus;
    code?: string | null;
    message?: string | null;
    resource?: string | null;
    correlationId?: string | null;
    traceId?: string | null;
    tenantId?: string | null;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.billingDiagnostic.create({
        data: {
          stage: input.stage,
          status: input.status,
          code: input.code ?? null,
          message: input.message ?? null,
          resource: input.resource ?? null,
          correlationId: input.correlationId ?? null,
          traceId: input.traceId ?? null,
          tenantId: input.tenantId ?? null,
          details: input.details ? (JSON.parse(JSON.stringify(input.details)) as object) : undefined,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Diagnostic Billing non bloquant en echec: ${input.stage}/${input.status} (${String(error)})`,
      );
    }
  }

  async list(params?: {
    stage?: BillingStage;
    status?: BillingDiagnosticStatus;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const take = Math.min(params?.limit ?? 50, 200);
    const skip = params?.page ? (params.page - 1) * take : 0;
    return this.prisma.billingDiagnostic.findMany({
      where: {
        ...(params?.stage ? { stage: params.stage } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.tenantId ? { tenantId: params.tenantId } : {}),
      },
      orderBy: { checkedAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * CDC 102 : les santees sont DISTINCTES. Un provider externe indisponible ne
   * doit pas faire conclure que toute la plateforme est down.
   */
  async health(): Promise<BillingHealthReport> {
    const checkedAt = new Date().toISOString();
    const report: BillingHealthReport = {
      billingProcess: {
        status: 'HEALTHY',
        message: 'Processus Billing operationnel.',
        checkedAt,
      },
      billingDb: {
        status: 'UNKNOWN',
        message: 'Connexion Billing DB non verifiee.',
        checkedAt,
      },
      entitlementResolver: {
        status: 'UNKNOWN',
        message: 'Resolver non sollicite.',
        checkedAt,
      },
      paymentProvider: {
        status: 'UNKNOWN',
        message: 'Aucun provider de paiement configure.',
        checkedAt,
      },
      webhookProcessing: {
        status: 'UNKNOWN',
        message: 'Aucun webhook de paiement recu.',
        checkedAt,
      },
      erpSync: {
        status: 'UNKNOWN',
        message: 'Aucune synchronisation ERP Billing configuree.',
        checkedAt,
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      report.billingDb = {
        status: 'HEALTHY',
        message: 'Base Billing accessible.',
        checkedAt,
      };
    } catch (error) {
      report.billingDb = {
        status: 'CRITICAL',
        // Le message ne contient jamais la chaine de connexion ni le secret.
        message: `Base Billing injoignable : ${error instanceof Error ? error.name : 'erreur inconnue'}.`,
        checkedAt,
      };
    }

    const [resolverFailure, invalidWebhooks] = await Promise.all([
      this.countRecent('ENTITLEMENT_RESOLVER', ['CRITICAL', 'DEGRADED']),
      this.prisma.billingWebhookEvent.count({ where: { signatureValid: false } }),
    ]);

    report.entitlementResolver =
      resolverFailure > 0
        ? {
            status: 'DEGRADED',
            message: `${resolverFailure} echec(s) recent(s) du resolver d'entitlements.`,
            checkedAt,
          }
        : {
            status: 'HEALTHY',
            message: 'Resolver d’entitlements sans echec recent.',
            checkedAt,
          };

    report.webhookProcessing =
      invalidWebhooks > 0
        ? {
            status: 'WARNING',
            message: `${invalidWebhooks} webhook(s) de paiement rejete(s) — signature invalide, aucun paiement modifie (RG-BILL-022).`,
            checkedAt,
          }
        : {
            status: 'HEALTHY',
            message: 'Aucun webhook de paiement invalide.',
            checkedAt,
          };

    // Aucun provider de paiement n'est configure en MVP : l'etat est declare
    // explicitement plutot que simule (CDC 44 / RG-BILL-039).
    report.paymentProvider = {
      status: 'UNKNOWN',
      message:
        'Aucun adaptateur de provider de paiement enregistre. Paiement manuel uniquement.',
      checkedAt,
    };

    report.erpSync = {
      status: 'UNKNOWN',
      message:
        'Billing n accede jamais directement a la base ERP : la synchronisation passerait par l’Integration Hub (RG-BILL-024/025).',
      checkedAt,
    };

    return report;
  }

  newCorrelationId(): string {
    return randomUUID();
  }

  private async countRecent(
    stage: BillingStage,
    statuses: BillingDiagnosticStatus[],
  ): Promise<number> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.billingDiagnostic.count({
      where: { stage, status: { in: statuses }, checkedAt: { gte: since } },
    });
  }
}