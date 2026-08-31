import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement } from '@prisma/client';

/**
 * Champs scalaires d'une entite de donnees, sans ses relations imbriquees
 * (attributs, compteur). Utilise pour la source/cible imbriquee d'une
 * `DataRelationEntity`.
 */
export class DataEntityRefEntity {
  @ApiProperty({ description: "Identifiant de l'entite de donnees." })
  id!: string;

  @ApiProperty({ description: "Nom de l'entite de donnees." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'entite de donnees.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: "Proprietaire de l'entite de donnees.", nullable: true, type: String })
  proprietaire?: string | null;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'entite de donnees." })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas.', nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas.', nullable: true, type: Number })
  positionY?: number | null;

  @ApiProperty({ description: "Identifiant de l'organisation proprietaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de creation.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de derniere mise a jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
