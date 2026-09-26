import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { IamJwtGuard } from './iam-jwt.guard';
import { IamPermissionGuard } from './iam-permission.guard';

/**
 * IAM module — Platform API security.
 *
 * La Platform API consomme l'identité IAM (Auth_AIM) via JWT.
 * Elle ne devient pas une nouvelle autorité d'identité :
 * elle VALIDE le token émis par IAM et dérive le principal.
 *
 * PRIVATE BY DEFAULT, PUBLIC BY EXCEPTION (@Public).
 *
 * Ordre d'exécution des guards globaux (NestJS applique dans l'ordre
 * de déclaration) :
 * 1. IamJwtGuard  → authentification + construction du principal
 * 2. IamPermissionGuard → vérification de la permission déclarée
 */
@Module({
  providers: [
    IamJwtGuard,
    IamPermissionGuard,
    {
      provide: APP_GUARD,
      useExisting: IamJwtGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: IamPermissionGuard,
    },
  ],
})
export class IamModule {}