import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutElement } from '@prisma/client';

/**
 * Champs scalaires d'une application, sans ses relations imbriquees
 * (zones, deploiements, echanges, services). Utilise pour l'application
 * imbriquee d'un `TechDeploiementEntity`.
 */
export class ApplicationRefEntity {
  @ApiProperty({ description: "Identifiant de l'application." })
  id!: string;

  @ApiProperty({ description: "Nom de l'application." })
  nom!: string;

  @ApiPropertyOptional({ description: "Description de l'application.", nullable: true, type: String })
  description?: string | null;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'application." })
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
