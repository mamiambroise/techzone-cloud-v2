import { createHash } from 'node:crypto';
import type { PrismaService } from '../../prisma/prisma.service';

/** Includes child records without updatedAt, removals and configuration overrides. */
export async function definitionRevision(db: PrismaService, applicationVersionId: string, tenantId: string) {
  const version = await db.applicationVersion.findFirst({ where: { id: applicationVersionId,tenantId } });
  if (!version) return null;
  const where = { applicationVersionId,tenantId };
  const parts = await Promise.all([
    db.bmEntity.findMany({ where,orderBy:{ id:'asc' },include:{ fields:{ orderBy:{ id:'asc' },include:{ validations:true } },constraints:true,indexes:true } }),
    db.bmRelation.findMany({ where,orderBy:{ id:'asc' } }),
    db.bmFeature.findMany({ where,orderBy:{ id:'asc' },include:{ capabilities:{ orderBy:{ id:'asc' } } } }),
    db.bmMenu.findMany({ where,orderBy:{ id:'asc' },include:{ items:{ orderBy:{ id:'asc' } } } }),
    db.bmBusinessContract.findMany({ where,orderBy:{ id:'asc' } }),
    db.bmVersionFeature.findMany({ where,orderBy:{ id:'asc' } }),
    db.bmVersionCapability.findMany({ where,orderBy:{ id:'asc' } }),
    db.configuration.findMany({ where:{ tenantId,OR:[{ scope:'APPLICATION',scopeId:version.applicationId },{ scope:'APPLICATION_VERSION',scopeId:applicationVersionId },{ scope:'TENANT',scopeId:tenantId },{ scope:'ENVIRONMENT' }] },orderBy:{ id:'asc' } }),
  ]);
  return 'sha256:' + createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}
