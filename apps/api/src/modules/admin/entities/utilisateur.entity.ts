import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Référence allégée vers l'organisation d'un utilisateur, telle que renvoyée
 * sur la liste des utilisateurs. */
export class AdminUtilisateurOrganisationRefEntity {
  @ApiProperty({ description: "Identifiant de l'organisation." })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation." })
  nom!: string;
}

/** Utilisateur tel que renvoyé sur la liste superadmin (`GET /admin/utilisateurs`),
 * hors comptes SUPERADMIN. */
export class AdminUtilisateurEntity {
  @ApiProperty({ description: "Identifiant de l'utilisateur." })
  id!: string;

  @ApiProperty({ description: "Nom de l'utilisateur." })
  nom!: string;

  @ApiProperty({ description: "Adresse e-mail de l'utilisateur." })
  email!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle de l'utilisateur." })
  role!: RoleUtilisateur;

  @ApiProperty({ description: 'Date de création du compte.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({
    type: () => AdminUtilisateurOrganisationRefEntity,
    nullable: true,
    description: "Organisation de rattachement de l'utilisateur.",
  })
  organisation?: AdminUtilisateurOrganisationRefEntity | null;
}
