import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_ORG_KEY = 'allowPendingOrganisation';

/**
 * Autorise une route authentifiée à être atteinte par un utilisateur dont
 * l'organisation n'est pas encore VALIDEE (statut EN_ATTENTE ou REJETEE).
 * Sans ce marqueur, OrganisationStatusGuard renvoie 403.
 *
 * Réservé aux routes strictement nécessaires pour afficher l'écran
 * « accès en attente » côté frontend (profil courant, organisation courante).
 *
 * @example
 * @AllowPendingOrganisation()
 * @Get('me')
 * findMine() { ... }
 */
export const AllowPendingOrganisation = () => SetMetadata(ALLOW_PENDING_ORG_KEY, true);
