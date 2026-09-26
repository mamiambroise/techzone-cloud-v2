import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

/**
 * Déclare la permission requise pour une route.
 *
 * Doit être utilisé avec le global RequirePermissionGuard
 * (enregistré comme APP_GUARD, qui applique IamJwtGuard + permission check).
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);