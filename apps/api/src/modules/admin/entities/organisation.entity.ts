import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur, StatutOrganisation } from '@prisma/client';

/** Organisation, avec l'ensemble de ses champs (vue superadmin). */
export class SuperAdminOrganisationEntity {
  @ApiProperty({ description: "Identifiant de l'organisation." })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'organisation.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: 'URL du logo.', nullable: true, type: String })
  logoUrl?: string | null;

  @ApiPropertyOptional({ description: "Secteur d'activité.", nullable: true, type: String })
  secteur?: string | null;

  @ApiPropertyOptional({ description: "Taille de l'organisation.", nullable: true, type: String })
  taille?: string | null;

  @ApiPropertyOptional({ description: 'Pays.', nullable: true, type: String })
  pays?: string | null;

  @ApiProperty({ enum: StatutOrganisation, description: "Statut de validation de l'organisation." })
  statut!: StatutOrganisation;

  @ApiPropertyOptional({ description: 'Date de validation par le superadmin.', type: String, format: 'date-time', nullable: true })
  validatedAt?: Date | null;

  @ApiPropertyOptional({ description: "Vision d'architecture (étape 1 de l'assistant TOGAF ADM).", nullable: true, type: String })
  vision?: string | null;

  @ApiPropertyOptional({ description: 'Problèmes à résoudre par cette organisation.', nullable: true, type: String })
  problemesResoudre?: string | null;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Référence allégée vers un utilisateur, telle que renvoyée sur le détail d'une organisation. */
export class AdminUtilisateurRefEntity {
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
}

/** Organisation avec la liste de ses utilisateurs (`GET /admin/organisations/:id`). */
export class AdminOrganisationEntity extends SuperAdminOrganisationEntity {
  @ApiProperty({
    type: () => AdminUtilisateurRefEntity,
    isArray: true,
    description: "Utilisateurs de l'organisation, triés par nom.",
  })
  users!: AdminUtilisateurRefEntity[];
}

/** Compteur d'utilisateurs d'une organisation, tel que renvoyé par le `_count`
 * Prisma sur la liste des organisations. */
export class OrganisationUsersCountEntity {
  @ApiProperty({ description: "Nombre d'utilisateurs de cette organisation." })
  users!: number;
}

/** Organisation telle que renvoyée sur la liste (`GET /admin/organisations`), en version allégée. */
export class AdminOrganisationListItemEntity {
  @ApiProperty({ description: "Identifiant de l'organisation." })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation." })
  nom!: string;

  @ApiPropertyOptional({ description: "Secteur d'activité.", nullable: true, type: String })
  secteur?: string | null;

  @ApiPropertyOptional({ description: "Taille de l'organisation.", nullable: true, type: String })
  taille?: string | null;

  @ApiPropertyOptional({ description: 'Pays.', nullable: true, type: String })
  pays?: string | null;

  @ApiProperty({ enum: StatutOrganisation, description: "Statut de validation de l'organisation." })
  statut!: StatutOrganisation;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Date de validation par le superadmin.', type: String, format: 'date-time', nullable: true })
  validatedAt?: Date | null;

  @ApiProperty({ type: () => OrganisationUsersCountEntity, description: "Compteur d'utilisateurs de cette organisation." })
  _count!: OrganisationUsersCountEntity;
}

/** E-mail simulé (aucun envoi réel), journalisé lors de la validation ou du
 * rejet d'une organisation. */
export class SimulatedEmailEntity {
  @ApiProperty({ description: 'Adresse e-mail du destinataire.' })
  to!: string;

  @ApiProperty({ description: "Objet de l'e-mail." })
  subject!: string;

  @ApiProperty({ description: "Corps de l'e-mail." })
  body!: string;
}

/** Organisation avec son compteur d'utilisateurs, telle que renvoyée par
 * valider/rejeter (qui incluent `_count` sur la mise à jour Prisma). */
export class SuperAdminOrganisationWithCountEntity extends SuperAdminOrganisationEntity {
  @ApiProperty({ type: () => OrganisationUsersCountEntity, description: "Compteur d'utilisateurs de cette organisation." })
  _count!: OrganisationUsersCountEntity;
}

/** Résultat de la validation ou du rejet d'une organisation : l'organisation
 * mise à jour et l'e-mail simulé envoyé à son administrateur. */
export class AdminOrganisationActionResultEntity {
  @ApiProperty({ type: () => SuperAdminOrganisationWithCountEntity, description: 'Organisation mise à jour.' })
  organisation!: SuperAdminOrganisationWithCountEntity;

  @ApiProperty({ type: () => SimulatedEmailEntity, description: "E-mail simulé envoyé à l'administrateur de l'organisation." })
  email!: SimulatedEmailEntity;
}
