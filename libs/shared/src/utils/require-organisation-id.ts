import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Toutes les routes tenant supposent un organisationId non nul. Seul le rôle
 * SUPERADMIN peut en être dépourvu, et SuperAdminGuard l'empêche déjà
 * d'atteindre ces routes — cette fonction est une seconde ligne de défense
 * qui transforme l'invariant en erreur explicite plutôt qu'en requête
 * Prisma silencieusement non filtrée (`where: { organisationId: undefined }`).
 */
export function requireOrganisationId(user: AuthUser): string {
  if (!user.organisationId) {
    throw new ForbiddenException('Compte non rattaché à une organisation');
  }
  return user.organisationId;
}
