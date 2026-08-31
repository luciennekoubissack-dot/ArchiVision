import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeZone } from '@prisma/client';

/** Référence légère vers une zone d'urbanisation, utilisée pour le lien parent. */
export class ZoneParentRefEntity {
  @ApiProperty({ description: "Identifiant de la zone parente." })
  id!: string;

  @ApiProperty({ description: "Nom de la zone parente." })
  nom!: string;

  @ApiProperty({ enum: TypeZone, description: "Type de la zone parente." })
  type!: TypeZone;
}

/** Référence légère vers une application, utilisée dans les affectations d'une zone. */
export class ZoneApplicationRefEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  id!: string;

  @ApiProperty({ description: "Nom de l'application." })
  nom!: string;
}

/** Affectation d'une application à une zone (référentiel POS), telle que renvoyée dans le détail d'une zone. */
export class ZoneApplicationEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  applicationId!: string;

  @ApiProperty({ description: "Identifiant de la zone." })
  zoneId!: string;

  @ApiProperty({ type: () => ZoneApplicationRefEntity, description: "Application affectée à la zone." })
  application!: ZoneApplicationRefEntity;
}

export class ZoneCountEntity {
  @ApiProperty({ description: "Nombre d'applications affectées à la zone." })
  applications!: number;
}

export class ZoneUrbanisationEntity {
  @ApiProperty({ description: "Identifiant de la zone d'urbanisation." })
  id!: string;

  @ApiProperty({ description: "Nom de la zone d'urbanisation." })
  nom!: string;

  @ApiProperty({ enum: TypeZone, description: "Type de la zone d'urbanisation." })
  type!: TypeZone;

  @ApiPropertyOptional({ description: "Identifiant de la zone parente.", nullable: true, type: String })
  parentId?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire de la zone." })
  organisationId!: string;

  @ApiProperty({ description: "Date de création de la zone.", type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: "Date de dernière modification de la zone.", type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => ZoneParentRefEntity, description: "Zone parente, si la zone n'est pas une racine.", nullable: true })
  parent?: ZoneParentRefEntity | null;

  @ApiPropertyOptional({
    type: () => [ZoneUrbanisationEntity],
    description: "Sous-zones (enfants directs) de la zone dans la hiérarchie Zone > Quartier > Îlot.",
  })
  enfants?: ZoneUrbanisationEntity[];

  @ApiPropertyOptional({ type: () => [ZoneApplicationEntity], description: "Applications affectées à la zone." })
  applications?: ZoneApplicationEntity[];

  @ApiPropertyOptional({ type: () => ZoneCountEntity, description: "Compteurs des relations de la zone." })
  _count?: ZoneCountEntity;
}
