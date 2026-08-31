import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur, StatutOrganisation } from '@prisma/client';

/** Utilisateur authentifié, tel que renvoyé dans la réponse de connexion ou d'inscription. */
export class AuthUserEntity {
  @ApiProperty({ description: "Identifiant de l'utilisateur." })
  id!: string;

  @ApiProperty({ description: "Adresse e-mail de l'utilisateur." })
  email!: string;

  @ApiProperty({ description: "Nom de l'utilisateur." })
  nom!: string;

  @ApiPropertyOptional({ description: "URL de l'avatar de l'utilisateur.", nullable: true, type: String })
  avatarUrl?: string | null;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle de l'utilisateur." })
  role!: RoleUtilisateur;
}

/** Référence allégée vers l'organisation nouvellement créée, telle que renvoyée à l'inscription. */
export class AuthOrganisationEntity {
  @ApiProperty({ description: "Identifiant de l'organisation." })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation." })
  nom!: string;

  @ApiProperty({ enum: StatutOrganisation, description: "Statut de validation de l'organisation." })
  statut!: StatutOrganisation;
}

/** Réponse renvoyée à la connexion : jeton d'accès et profil utilisateur authentifié. */
export class AuthResponseEntity {
  @ApiProperty({ description: "Jeton JWT d'accès, également posé en cookie." })
  accessToken!: string;

  @ApiProperty({ type: () => AuthUserEntity, description: 'Profil utilisateur authentifié.' })
  user!: AuthUserEntity;
}

/** Réponse renvoyée à l'inscription : jeton d'accès, profil utilisateur et
 * organisation nouvellement créée pour ce compte. */
export class RegisterResponseEntity extends AuthResponseEntity {
  @ApiProperty({ type: () => AuthOrganisationEntity, description: "Organisation nouvellement créée pour l'utilisateur inscrit." })
  organisation!: AuthOrganisationEntity;
}
