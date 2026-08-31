import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Membre de l'organisation (utilisateur), sans son mot de passe ni son
 * empreinte de mot de passe : le service exclut volontairement ces champs via
 * un `select` Prisma explicite. */
export class MembreEntity {
  @ApiProperty({ description: 'Identifiant du membre.' })
  id!: string;

  @ApiProperty({ description: 'Adresse email du membre.' })
  email!: string;

  @ApiProperty({ description: 'Nom du membre.' })
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: 'Rôle attribué au membre.' })
  role!: RoleUtilisateur;

  @ApiPropertyOptional({ description: 'Identifiant du service auquel le membre est rattaché.', nullable: true, type: String })
  serviceId?: string | null;

  @ApiPropertyOptional({ description: 'Poste occupé par le membre.', nullable: true, type: String })
  poste?: string | null;

  @ApiPropertyOptional({ description: 'Coordonnées de contact du membre.', nullable: true, type: String })
  contact?: string | null;

  @ApiProperty({ description: 'Date de création du compte.', type: String, format: 'date-time' })
  createdAt!: Date;
}
