import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';

/** Membre (utilisateur) rattaché à un service, tel que renvoyé sur le détail. */
export class ServiceMembreEntity {
  @ApiProperty({ description: "Identifiant de l'utilisateur." })
  id!: string;

  @ApiProperty({ description: "Nom de l'utilisateur." })
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur, description: "Rôle de l'utilisateur." })
  role!: RoleUtilisateur;
}

/** Référence allégée vers le service parent, telle que renvoyée sur le détail. */
export class ServiceParentRefEntity {
  @ApiProperty({ description: 'Identifiant du service parent.' })
  id!: string;

  @ApiProperty({ description: 'Nom du service parent.' })
  nom!: string;
}

/** Référence allégée vers le membre titulaire du poste. */
export class ServiceTitulaireRefEntity {
  @ApiProperty({ description: 'Identifiant du membre titulaire.' })
  id!: string;

  @ApiProperty({ description: 'Nom du membre titulaire.' })
  nom!: string;
}

/** Compteur de membres rattachés à un service, tel que renvoyé par le `_count`
 * Prisma sur la liste des services. */
export class ServiceMembreCountEntity {
  @ApiProperty({ description: 'Nombre de membres rattachés à ce service.' })
  membres!: number;
}

/** Service d'entreprise (département), organisé en hiérarchie via `parentId`/`enfants`. */
export class ServiceEntity {
  @ApiProperty({ description: 'Identifiant du service.' })
  id!: string;

  @ApiProperty({ description: 'Nom du service.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description du service.', nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Identifiant du service parent, le cas échéant.', nullable: true, type: String })
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Identifiant du membre titulaire du poste, le cas échéant.', nullable: true, type: String })
  titulaireId?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: () => ServiceParentRefEntity,
    nullable: true,
    description: 'Service parent (uniquement sur la récupération par identifiant).',
  })
  parent?: ServiceParentRefEntity | null;

  @ApiPropertyOptional({
    type: () => ServiceEntity,
    isArray: true,
    description: 'Services enfants directs, triés par nom (sur deux niveaux pour la liste, un niveau pour le détail).',
  })
  enfants?: ServiceEntity[];

  @ApiPropertyOptional({
    type: () => ServiceMembreEntity,
    isArray: true,
    description: 'Membres rattachés à ce service (uniquement sur la récupération par identifiant).',
  })
  membres?: ServiceMembreEntity[];

  @ApiPropertyOptional({
    type: () => ServiceTitulaireRefEntity,
    nullable: true,
    description: 'Membre qui occupe ce poste (null si vacant).',
  })
  titulaire?: ServiceTitulaireRefEntity | null;

  @ApiPropertyOptional({
    type: () => ServiceMembreCountEntity,
    description: 'Compteur de membres rattachés à ce service (uniquement sur la liste).',
  })
  _count?: ServiceMembreCountEntity;
}
