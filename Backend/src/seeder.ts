import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import dataSource from './config/data-source';
import {
  ApplicationStatus,
  ApplicationVersionStatus,
  Environment,
  PublicationStatus,
  PublicationType,
  ResultType,
} from './common/enums';
import { Application } from './modules/business-manager/entities/application.entity';
import { ApplicationVersion } from './modules/business-manager/entities/application-version.entity';
import { Publication } from './modules/business-manager/entities/publication.entity';
import { ActivityEvent } from './modules/business-manager/entities/activity-event.entity';

const seedAdminId = '11111111-1111-4111-8111-111111111111';

const appSeedData = [
  {
    code: 'boutique',
    name: 'Boutique Mode & Chaussures',
    description: 'Plateforme e-commerce avec catalogue, panier et suivi des commandes.',
    category: 'commerce',
    icon: 'shopping-bag',
    status: ApplicationStatus.ACTIVE,
    environment: Environment.PRODUCTION,
    versions: [
      {
        versionNumber: '0.1.0',
        status: ApplicationVersionStatus.PUBLISHED,
        comment: 'Première publication de démonstration',
        snapshot: { modules: ['catalog', 'cart', 'checkout'] },
      },
      {
        versionNumber: '1.0.0',
        status: ApplicationVersionStatus.PUBLISHED,
        comment: 'Version stable de production',
        snapshot: { modules: ['catalog', 'cart', 'checkout', 'orders', 'analytics'] },
      },
      {
        versionNumber: '1.1.0',
        status: ApplicationVersionStatus.DRAFT,
        comment: 'Version en préparation pour la relance marketing',
        snapshot: { modules: ['catalog', 'cart', 'checkout', 'orders', 'analytics', 'loyalty'] },
      },
    ],
    publication: {
      environment: Environment.PRODUCTION,
      type: PublicationType.PUBLISH,
      status: PublicationStatus.SUCCESS,
      result: { release: 'boutique-v1.0.0', note: 'Mise en production du catalogue' },
    },
  },
  {
    code: 'crm-sales',
    name: 'CRM Commercial',
    description: 'Gestion des prospects, ventes, suivis multicanal et reporting commercial.',
    category: 'crm',
    icon: 'user-check',
    status: ApplicationStatus.READY,
    environment: Environment.STAGING,
    versions: [
      {
        versionNumber: '0.1.0',
        status: ApplicationVersionStatus.DRAFT,
        comment: 'Prototype du pipeline commercial',
        snapshot: { modules: ['leads', 'pipeline', 'tasks'] },
      },
      {
        versionNumber: '0.9.0',
        status: ApplicationVersionStatus.READY,
        comment: 'Version de validation pour recette',
        snapshot: { modules: ['leads', 'pipeline', 'tasks', 'reports'] },
      },
    ],
  },
  {
    code: 'support-helpdesk',
    name: 'Helpdesk Support',
    description: 'Support client avec tickets, SLA, escalades et tableau de bord des incidents.',
    category: 'support',
    icon: 'headset',
    status: ApplicationStatus.TESTING,
    environment: Environment.DEVELOPMENT,
    versions: [
      {
        versionNumber: '0.1.0',
        status: ApplicationVersionStatus.TESTING,
        comment: 'Tests fonctionnels sur les flux support',
        snapshot: { modules: ['tickets', 'sla', 'escalation'] },
      },
      {
        versionNumber: '0.2.0',
        status: ApplicationVersionStatus.DRAFT,
        comment: 'Amélioration des workflows de tri des demandes',
        snapshot: { modules: ['tickets', 'sla', 'escalation', 'knowledge-base'] },
      },
    ],
  },
];

async function seedDemoData() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const appRepository = dataSource.getRepository(Application);
  const versionRepository = dataSource.getRepository(ApplicationVersion);
  const publicationRepository = dataSource.getRepository(Publication);
  const activityRepository = dataSource.getRepository(ActivityEvent);

  await dataSource.query(
    'TRUNCATE TABLE "activity_events", "publications", "application_versions", "applications" RESTART IDENTITY CASCADE;',
  );

  const seededApplications = await appRepository.save(
    appRepository.create(
      appSeedData.map((app) => ({
        code: app.code,
        name: app.name,
        description: app.description,
        category: app.category,
        icon: app.icon,
        status: app.status,
        environment: app.environment,
        createdBy: seedAdminId,
      })),
    ),
  );

  for (let i = 0; i < seededApplications.length; i += 1) {
    const seedApp = appSeedData[i];
    const application = seededApplications[i];
    const savedVersions: ApplicationVersion[] = [];

    for (const versionSeed of seedApp.versions) {
      const version = await versionRepository.save(
        versionRepository.create({
          applicationId: application.id,
          versionNumber: versionSeed.versionNumber,
          status: versionSeed.status,
          snapshot: versionSeed.snapshot,
          comment: versionSeed.comment,
          createdBy: seedAdminId,
        }),
      );

      savedVersions.push(version);
    }

    const latestVersion = savedVersions[savedVersions.length - 1];
    const publishedVersion = savedVersions.find(
      (version) => version.status === ApplicationVersionStatus.PUBLISHED,
    );

    await appRepository.update(application.id, {
      currentVersionId: latestVersion.id,
      publishedVersionId: publishedVersion?.id,
      version: savedVersions.length,
    });

    if (seedApp.publication && publishedVersion) {
      await publicationRepository.save(
        publicationRepository.create({
          applicationId: application.id,
          versionId: publishedVersion.id,
          environment: seedApp.publication.environment,
          type: seedApp.publication.type,
          status: seedApp.publication.status,
          publishedBy: seedAdminId,
          result: seedApp.publication.result,
        }),
      );
    }

    for (const version of savedVersions) {
      await activityRepository.save(
        activityRepository.create({
          applicationId: application.id,
          actorId: seedAdminId,
          eventType: 'application.version.seeded',
          action: 'SEED',
          targetType: 'ApplicationVersion',
          targetId: version.id,
          result: ResultType.SUCCESS,
          before: null,
          after: { version: version.versionNumber, status: version.status },
          metadata: {
            demo: true,
            appCode: application.code,
          },
          traceId: randomUUID(),
        }),
      );
    }

    await activityRepository.save(
      activityRepository.create({
        applicationId: application.id,
        actorId: seedAdminId,
        eventType: 'application.seeded',
        action: 'SEED',
        targetType: 'Application',
        targetId: application.id,
        result: ResultType.SUCCESS,
        metadata: {
          demo: true,
          scenario: 'lifecycle-simulation',
        },
        traceId: randomUUID(),
      }),
    );
  }

  console.log(`Seeded ${seededApplications.length} applications with realistic lifecycle data.`);
}

seedDemoData()
  .then(async () => {
    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  });
