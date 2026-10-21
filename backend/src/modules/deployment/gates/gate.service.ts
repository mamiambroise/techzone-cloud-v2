import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApproveGateDto } from './dto/approve-gate.dto';
import { BypassGateDto } from './dto/bypass-gate.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { type IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { randomUUID } from 'crypto';

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(principal: IamAuthContext): string {
    const tenantId = principal?.tenantId;
    if (!tenantId || tenantId === 'legacy') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_PERMISSION_DENIED,
        'An active tenant context is required for deployment gate operations',
        HttpStatus.FORBIDDEN,
      );
    }
    return tenantId;
  }

  private async deploymentForTenant(
    deploymentId: string,
    tenantId: string,
  ) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, tenantId },
      include: { release: true, environment: true },
    });
    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return deployment;
  }

  private assertGateMutationAllowed(deployment: { status: string }) {
    if (!['PENDING', 'RUNNING', 'VERIFYING'].includes(deployment.status)) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_BYPASS_FORBIDDEN,
        `Deployment gates cannot be changed after terminal status "${deployment.status}"`,
        HttpStatus.CONFLICT,
      );
    }
  }

  async findByDeployment(
    deploymentId: string,
    principal: IamAuthContext,
  ) {
    const tenantId = this.requireTenant(principal);
    await this.deploymentForTenant(deploymentId, tenantId);
    return this.prisma.deploymentGate.findMany({
      where: { deploymentId },
      orderBy: { executedAt: 'asc' },
    });
  }

  /**
   * No generic CI/security gate evaluator is configured. Return persisted
   * evidence without mutating it; this endpoint must never manufacture PASS.
   */
  async evaluate(deploymentId: string, principal: IamAuthContext) {
    const tenantId = this.requireTenant(principal);
    const deployment = await this.deploymentForTenant(deploymentId, tenantId);
    const gates = await this.prisma.deploymentGate.findMany({
      where: { deploymentId },
      orderBy: { executedAt: 'asc' },
    });
    const allPassed = gates
      .filter((gate) => gate.required)
      .every((gate) => gate.result === 'PASSED');

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment.traceId || `trc-gate-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: deployment.releaseId,
        deploymentId: deployment.id,
        applicationId: deployment.release.applicationId,
        environmentId: deployment.environmentId,
        action: 'GATE_CHECK',
        // This endpoint has not run an external evaluator, so its audit
        // event must not itself be interpreted as a new passing proof.
        status: 'UNVERIFIED',
        actor: principal.userId,
        metadata: {
          evaluated: false,
          reason: 'NO_REAL_GATE_EVALUATOR_CONFIGURED',
          requiredGateCount: gates.filter((gate) => gate.required).length,
        },
      },
    });

    return {
      deploymentId,
      allPassed,
      evaluated: false,
      reason: 'NO_REAL_GATE_EVALUATOR_CONFIGURED',
      gates,
    };
  }

  async approve(
    deploymentId: string,
    gateId: string,
    dto: ApproveGateDto,
    principal: IamAuthContext,
  ) {
    const tenantId = this.requireTenant(principal);
    const deployment = await this.deploymentForTenant(deploymentId, tenantId);
    this.assertGateMutationAllowed(deployment);
    const gate = await this.prisma.deploymentGate.findFirst({
      where: { id: gateId, deploymentId },
    });

    if (!gate) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_NOT_FOUND,
        `Gate "${gateId}" not found for deployment "${deploymentId}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (gate.type !== 'MANUAL_APPROVAL') {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_BYPASS_FORBIDDEN,
        'Only an explicit MANUAL_APPROVAL gate can be approved by a user',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.deploymentGate.update({
      where: { id: gateId },
      data: {
        result: 'PASSED',
        message: dto.comment ? `Approved: ${dto.comment}` : 'Manually approved',
        executedBy: principal.userId,
        executedAt: new Date(),
        metadata: { source: 'MANUAL_APPROVAL', actor: principal.userId },
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment.traceId || `trc-appr-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: deployment.releaseId,
        deploymentId,
        applicationId: deployment.release.applicationId,
        environmentId: deployment.environmentId,
        action: 'GATE_CHECK',
        status: 'PASSED',
        actor: principal.userId,
        metadata: {
          gateId,
          gateType: gate.type,
          approvalComment: dto.comment,
          source: 'MANUAL_APPROVAL',
        },
      },
    });

    return updated;
  }

  async bypass(
    deploymentId: string,
    gateId: string,
    dto: BypassGateDto,
    principal: IamAuthContext,
  ) {
    const tenantId = this.requireTenant(principal);
    const deployment = await this.deploymentForTenant(deploymentId, tenantId);
    this.assertGateMutationAllowed(deployment);
    const gate = await this.prisma.deploymentGate.findFirst({
      where: { id: gateId, deploymentId },
    });

    if (!gate) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_NOT_FOUND,
        `Gate "${gateId}" not found for deployment "${deploymentId}"`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      gate.required ||
      ['ENVIRONMENT_READY', 'HEALTH_PRECHECK'].includes(gate.type)
    ) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_BYPASS_FORBIDDEN,
        'Required, environment, and runtime-readiness gates cannot be bypassed',
        HttpStatus.FORBIDDEN,
      );
    }
    if (!dto.justification || dto.justification.trim().length < 5) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_BYPASS_FORBIDDEN,
        'Gate bypass requires a valid audit justification of at least 5 characters',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.deploymentGate.update({
      where: { id: gateId },
      data: {
        result: 'SKIPPED',
        message: `BYPASS: ${dto.justification}`,
        executedBy: principal.userId,
        executedAt: new Date(),
        metadata: { source: 'MANUAL_BYPASS', actor: principal.userId },
      },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment.traceId || `trc-byp-${randomUUID().slice(0, 8)}`,
        tenantId,
        releaseId: deployment.releaseId,
        deploymentId,
        applicationId: deployment.release.applicationId,
        environmentId: deployment.environmentId,
        action: 'GATE_CHECK',
        status: 'SKIPPED',
        actor: principal.userId,
        metadata: {
          gateId,
          gateType: gate.type,
          justification: dto.justification,
          isBypass: true,
        },
      },
    });

    return updated;
  }
}
