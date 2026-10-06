import { HttpStatus } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PlatformErrorCode } from '../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../common/errors/platform.exception';

/**
 * Statuts d'une ApplicationVersion dans lesquels la Business Definition est
 * figée. Aligné sur `version-lifecycle.util.ts` : une version publiée
 * (ACTIVE) ou retirée (SUPERSEDED / DEPRECATED / ARCHIVED) ne doit plus
 * accepter d'écriture métier, sinon le contrat d'immuabilité préparé par le
 * Pack Manager (snapshot figé au moment de la publication) serait rompu.
 */
export const IMMUTABLE_VERSION_STATUSES = [
  'ACTIVE',
  'SUPERSEDED',
  'DEPRECATED',
  'ARCHIVED',
] as const;

export function isImmutableVersionStatus(status: string): boolean {
  return (IMMUTABLE_VERSION_STATUSES as readonly string[]).includes(status);
}

/**
 * Vérifie qu'une ApplicationVersion existe dans le tenant ET qu'elle accepte
 * encore une écriture de définition. Les services BM appellent ce guards
 * avant chaque mutation.
 */
export async function assertVersionWritable(
  prisma: PrismaService,
  applicationVersionId: string,
  tenantId: string | null,
): Promise<{ id: string; applicationId: string; status: string; version: string }> {
  const version = await prisma.applicationVersion.findFirst({
    where: { id: applicationVersionId, tenantId: tenantId ?? undefined },
    select: { id: true, applicationId: true, status: true, version: true },
  });

  if (!version) {
    throw new PlatformException(
      PlatformErrorCode.VERSION_NOT_FOUND,
      `Application version "${applicationVersionId}" not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  if (isImmutableVersionStatus(version.status)) {
    throw new PlatformException(
      PlatformErrorCode.VERSION_IMMUTABLE,
      `Version "${version.version}" is ${version.status}: its business definition is immutable`,
      HttpStatus.CONFLICT,
    );
  }

  return version;
}

/**
 * Variante « lecture + écriture » : pour les ressources qui appartiennent à
 * une version (BmEntity, BmField, BmFeature, BmMenu…), on résout d'abord la
 * version parente puis on applique la même règle d'immuabilité.
 */
export async function assertResourceVersionWritable(
  prisma: PrismaService,
  lookup: () => Promise<{ applicationVersionId: string } | null>,
  resourceLabel: string,
  tenantId: string | null,
): Promise<void> {
  const resource = await lookup();
  if (!resource) return; // l'appelant gère déjà le cas "introuvable"
  await assertVersionWritable(prisma, resource.applicationVersionId, tenantId);
}