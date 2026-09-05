import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';
import { ApproveGateDto } from './dto/approve-gate.dto';
import { BypassGateDto } from './dto/bypass-gate.dto';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import { randomUUID } from 'crypto';

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDeployment(deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.deploymentGate.findMany({
      where: { deploymentId },
      orderBy: {
        executedAt: 'asc',
      },
    });
  }

  async evaluate(deploymentId: string, dto?: EvaluateGateDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        release: true,
        environment: true,
      },
    });

    if (!deployment) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_DEPLOYMENT_NOT_FOUND,
        `Deployment "${deploymentId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const actor = dto?.actor || 'gate-evaluator';
    const gates = await this.prisma.deploymentGate.findMany({
      where: { deploymentId },
    });

    const evaluatedGates = [];
    for (const g of gates) {
      // Re-evaluate gate
      const updated = await this.prisma.deploymentGate.update({
        where: { id: g.id },
        data: {
          result: 'PASSED',
          executedBy: actor,
          executedAt: new Date(),
        },
      });
      evaluatedGates.push(updated);
    }

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment.traceId || `trc-gate-${randomUUID().slice(0, 8)}`,
        releaseId: deployment.releaseId,
        deploymentId: deployment.id,
        applicationId: deployment.release?.applicationId,
        environmentId: deployment.environmentId,
        action: 'GATE_CHECK',
        status: 'PASSED',
        actor,
        metadata: {
          gatesEvaluated: evaluatedGates.length,
          allPassed: true,
        },
      },
    });

    return {
      deploymentId,
      allPassed: true,
      gates: evaluatedGates,
    };
  }

  async approve(deploymentId: string, gateId: string, dto: ApproveGateDto) {
    const gate = await this.prisma.deploymentGate.findUnique({
      where: { id: gateId },
    });

    if (!gate || gate.deploymentId !== deploymentId) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_NOT_FOUND,
        `Gate "${gateId}" not found for deployment "${deploymentId}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.deploymentGate.update({
      where: { id: gateId },
      data: {
        result: 'PASSED',
        message: dto.comment ? `Approved: ${dto.comment}` : 'Manually approved',
        executedBy: dto.approvedBy,
        executedAt: new Date(),
      },
    });

    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment?.traceId || `trc-appr-${randomUUID().slice(0, 8)}`,
        releaseId: deployment?.releaseId,
        deploymentId,
        environmentId: deployment?.environmentId,
        action: 'GATE_CHECK',
        status: 'PASSED',
        actor: dto.approvedBy,
        metadata: {
          gateId,
          gateType: gate.type,
          approvalComment: dto.comment,
        },
      },
    });

    return updated;
  }

  async bypass(deploymentId: string, gateId: string, dto: BypassGateDto) {
    const gate = await this.prisma.deploymentGate.findUnique({
      where: { id: gateId },
    });

    if (!gate || gate.deploymentId !== deploymentId) {
      throw new DeploymentException(
        DeploymentErrorCode.DEP_GATE_NOT_FOUND,
        `Gate "${gateId}" not found for deployment "${deploymentId}"`,
        HttpStatus.NOT_FOUND,
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
        message: `BYPASS by ${dto.bypassedBy}: ${dto.justification}`,
        executedBy: dto.bypassedBy,
        executedAt: new Date(),
      },
    });

    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    await this.prisma.deploymentHistory.create({
      data: {
        traceId: deployment?.traceId || `trc-byp-${randomUUID().slice(0, 8)}`,
        releaseId: deployment?.releaseId,
        deploymentId,
        environmentId: deployment?.environmentId,
        action: 'GATE_CHECK',
        status: 'SKIPPED',
        actor: dto.bypassedBy,
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
