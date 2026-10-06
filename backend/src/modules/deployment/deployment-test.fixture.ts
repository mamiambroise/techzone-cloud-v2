import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

/** Dedicated database records: never select or mutate a developer's first row. */
export async function createDeploymentFixture(prisma: PrismaService) {
  return prisma.$transaction(async (tx) => {
    const code = `deployment-test-${randomUUID()}`;
    const tenant = await tx.tenant.create({
      data: { id: randomUUID(), code, name: code, status: 'ACTIVE' },
    });
    const application = await tx.application.create({
      data: { code, name: code, tenantId: tenant.id },
    });
    const version = await tx.applicationVersion.create({
      data: {
        applicationId: application.id,
        version: '1.0.0',
        tenantId: tenant.id,
      },
    });
    const environment = await tx.environment.create({
      data: { code, name: code, type: 'TEST', tenantId: tenant.id },
    });
    const snapshot = await tx.snapshot.create({
      data: {
        applicationId: application.id,
        applicationVersionId: version.id,
        environmentId: environment.id,
        tenantId: tenant.id,
        contracts: [],
        configuration: {},
        hash: randomUUID(),
        createdBy: 'isolated-test',
        status: 'VALID',
      },
    });
    const release = await tx.release.create({
      data: {
        code,
        version: '1.0.0',
        applicationId: application.id,
        applicationVersionId: version.id,
        snapshotId: snapshot.id,
        tenantId: tenant.id,
        configurationVersion: '1.0.0',
        artifactRefs: [],
        contractVersions: [],
        createdBy: 'isolated-test',
        status: 'RELEASED',
      },
    });
    const deployment = await tx.deployment.create({
      data: {
        releaseId: release.id,
        environmentId: environment.id,
        tenantId: tenant.id,
        status: 'SUCCEEDED',
        startedBy: 'isolated-test',
        healthStatus: 'HEALTHY',
      },
    });
    await tx.environmentDeployment.create({
      data: {
        applicationId: application.id,
        environmentId: environment.id,
        tenantId: tenant.id,
        currentReleaseId: release.id,
        deploymentId: deployment.id,
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
      },
    });
    return {
      tenant,
      application,
      version,
      environment,
      snapshot,
      release,
      deployment,
    };
  });
}

export type DeploymentFixture = Awaited<
  ReturnType<typeof createDeploymentFixture>
>;

export async function removeDeploymentFixture(
  prisma: PrismaService,
  fixture?: DeploymentFixture,
) {
  if (!fixture) return;
  const { application, environment, tenant } = fixture;
  if (
    !tenant.code.startsWith('deployment-test-') ||
    application.tenantId !== tenant.id
  ) {
    throw new Error('Refusing cleanup outside the isolated deployment fixture');
  }
  await prisma.$transaction(async (tx) => {
    await tx.deploymentHistory.deleteMany({
      where: {
        OR: [
          { applicationId: application.id },
          { environmentId: environment.id },
        ],
      },
    });
    await tx.rollback.deleteMany({
      where: { deployment: { release: { applicationId: application.id } } },
    });
    await tx.environmentDeployment.deleteMany({
      where: { applicationId: application.id },
    });
    await tx.deployment.deleteMany({
      where: { release: { applicationId: application.id } },
    });
    await tx.release.deleteMany({ where: { applicationId: application.id } });
    await tx.snapshot.deleteMany({ where: { applicationId: application.id } });
    await tx.applicationVersion.deleteMany({
      where: { applicationId: application.id },
    });
    await tx.application.delete({ where: { id: application.id } });
    await tx.environmentHistory.deleteMany({
      where: { environmentId: environment.id },
    });
    await tx.environment.delete({ where: { id: environment.id } });
    await tx.tenant.delete({ where: { id: tenant.id } });
  });
}
