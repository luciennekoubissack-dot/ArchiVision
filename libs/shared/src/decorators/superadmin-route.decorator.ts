import { SetMetadata } from '@nestjs/common';

export const SUPERADMIN_ROUTE_KEY = 'isSuperAdminRoute';

/**
 * Marque un endpoint comme réservé au rôle SUPERADMIN — à utiliser avec
 * SuperAdminGuard, qui interdit dans les deux sens : un SUPERADMIN ne peut
 * atteindre que les routes marquées ainsi, et seul un SUPERADMIN peut les
 * atteindre.
 *
 * @example
 * @SuperAdminRoute()
 * @Delete(':id')
 * remove() { ... }
 */
export const SuperAdminRoute = () => SetMetadata(SUPERADMIN_ROUTE_KEY, true);
