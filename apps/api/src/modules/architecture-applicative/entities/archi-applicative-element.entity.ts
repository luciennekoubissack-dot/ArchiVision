import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeElementArchiApplicative } from '@prisma/client';

/** Élément du diagramme d'architecture applicative (utilisateur, application,
 * base de données, système externe, infrastructure ou sécurité). */
export class ArchiApplicativeElementEntity {
  @ApiProperty({ description: "Identifiant de l'élément d'architecture applicative." })
  id!: string;

  @ApiProperty({ description: "Nom de l'élément d'architecture applicative." })
  nom!: string;

  @ApiProperty({ enum: TypeElementArchiApplicative, description: "Type de l'élément d'architecture applicative." })
  type!: TypeElementArchiApplicative;

  @ApiPropertyOptional({ description: "Description détaillée de l'élément.", nullable: true, type: String })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Position horizontale sur le canevas.', nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Position verticale sur le canevas.', nullable: true, type: Number })
  positionY?: number | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière modification.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
