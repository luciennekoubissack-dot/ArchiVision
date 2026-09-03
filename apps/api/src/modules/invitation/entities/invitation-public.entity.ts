import { ApiProperty } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Ce que la page publique « Rejoindre » affiche avant que la personne ne
 * crée son compte : strictement le minimum, sans identifiant ni jeton. */
export class InvitationPublicEntity {
  @ApiProperty({ description: "Adresse e-mail invitée (pré-remplie, non modifiable)." })
  email!: string;

  @ApiProperty({ description: "Nom de l'organisation qui invite." })
  organisationNom!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle qui sera attribué à l'acceptation." })
  role!: RoleUtilisateur;
}
