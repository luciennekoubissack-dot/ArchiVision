import { SetMetadata } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restreint un endpoint aux rôles listés — à utiliser avec RolesGuard.
 *
 * @example
 * @Roles(RoleUtilisateur.ADMINISTRATEUR)
 * @UseGuards(RolesGuard)
 * @Delete(':id')
 * remove() { ... }
 */
export const Roles = (...roles: RoleUtilisateur[]) => SetMetadata(ROLES_KEY, roles);
