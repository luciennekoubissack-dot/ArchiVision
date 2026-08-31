import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement, TypeZone } from '@prisma/client';

/** Référence légère vers une zone d'urbanisation, utilisée dans les affectations d'une application. */
export class ApplicationZoneRefEntity {
  @ApiProperty({ description: "Identifiant de la zone." })
  id!: string;

  @ApiProperty({ description: "Nom de la zone." })
  nom!: string;

  @ApiProperty({ enum: TypeZone, description: "Type de la zone." })
  type!: TypeZone;
}

/** Affectation d'une application à une zone (référentiel POS), telle que renvoyée dans le détail d'une application. */
export class ApplicationZoneEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  applicationId!: string;

  @ApiProperty({ description: "Identifiant de la zone." })
  zoneId!: string;

  @ApiProperty({ type: () => ApplicationZoneRefEntity, description: "Zone affectée." })
  zone!: ApplicationZoneRefEntity;
}

export class ApplicationServiceEntity {
  @ApiProperty({ description: "Identifiant du service applicatif." })
  id!: string;

  @ApiProperty({ description: "Nom du service applicatif." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description du service applicatif.", nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ description: "Identifiant de l'application propriétaire du service." })
  applicationId!: string;
}

/** Référence légère vers une application, utilisée côté source ou cible d'un échange. */
export class ApplicationEchangeRefEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  id!: string;

  @ApiProperty({ description: "Nom de l'application." })
  nom!: string;
}

/** Échange applicatif, vu depuis l'application source (la cible est référencée). */
export class ApplicationEchangeAsSourceEntity {
  @ApiProperty({ description: "Identifiant de l'échange." })
  id!: string;

  @ApiProperty({ description: "Identifiant de l'application source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'application cible." })
  targetId!: string;

  @ApiPropertyOptional({ description: "Description de l'échange.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Protocole utilisé pour l'échange.", nullable: true, type: String })
  protocole?: string | null;

  @ApiProperty({ description: "Date de création de l'échange.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: () => ApplicationEchangeRefEntity, description: "Application cible de l'échange." })
  target!: ApplicationEchangeRefEntity;
}

/** Échange applicatif, vu depuis l'application cible (la source est référencée). */
export class ApplicationEchangeAsTargetEntity {
  @ApiProperty({ description: "Identifiant de l'échange." })
  id!: string;

  @ApiProperty({ description: "Identifiant de l'application source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'application cible." })
  targetId!: string;

  @ApiPropertyOptional({ description: "Description de l'échange.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Protocole utilisé pour l'échange.", nullable: true, type: String })
  protocole?: string | null;

  @ApiProperty({ description: "Date de création de l'échange.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: () => ApplicationEchangeRefEntity, description: "Application source de l'échange." })
  source!: ApplicationEchangeRefEntity;
}

export class ApplicationCountEntity {
  @ApiProperty({ description: "Nombre de zones d'urbanisation auxquelles l'application est affectée." })
  zones!: number;

  @ApiProperty({ description: "Nombre de services applicatifs de l'application." })
  services!: number;

  @ApiProperty({ description: "Nombre d'échanges où l'application est source." })
  echangesSource!: number;

  @ApiProperty({ description: "Nombre d'échanges où l'application est cible." })
  echangesTarget!: number;
}

export class ApplicationEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  id!: string;

  @ApiProperty({ description: "Nom de l'application." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'application.", nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'application (AS_IS, TO_BE ou LES_DEUX)." })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: "Position horizontale de l'application sur le canevas.", nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: "Position verticale de l'application sur le canevas.", nullable: true, type: Number })
  positionY?: number | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de l'application." })
  organisationId!: string;

  @ApiProperty({ description: "Date de création de l'application.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: "Date de dernière modification de l'application.", type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => [ApplicationServiceEntity], description: "Services applicatifs de l'application." })
  services?: ApplicationServiceEntity[];

  @ApiPropertyOptional({ type: () => ApplicationCountEntity, description: "Compteurs des relations de l'application." })
  _count?: ApplicationCountEntity;

  @ApiPropertyOptional({ type: () => [ApplicationZoneEntity], description: "Zones d'urbanisation auxquelles l'application est affectée." })
  zones?: ApplicationZoneEntity[];

  @ApiPropertyOptional({
    type: () => [ApplicationEchangeAsSourceEntity],
    description: "Échanges applicatifs dans lesquels l'application est source.",
  })
  echangesSource?: ApplicationEchangeAsSourceEntity[];

  @ApiPropertyOptional({
    type: () => [ApplicationEchangeAsTargetEntity],
    description: "Échanges applicatifs dans lesquels l'application est cible.",
  })
  echangesTarget?: ApplicationEchangeAsTargetEntity[];
}
