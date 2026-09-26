import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './iam.constants';

/**
 * Explicit public route marker.
 *
 * PRIVATE BY DEFAULT, PUBLIC BY EXCEPTION.
 * Seules les routes décorées de @Public() sont accessibles sans authentification.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);