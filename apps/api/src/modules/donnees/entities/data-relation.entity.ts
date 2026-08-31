import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeCardinalite } from '@prisma/client';

/** Relation entre deux entites de donnees, sans la source/cible imbriquee (ex. reponse de creation). */
export class DataRelationEntity {
  @ApiProperty({ description: 'Identifiant de la relation.' })
  id!: string;

  @ApiProperty({ enum: TypeCardinalite, description: 'Cardinalite de la relation.' })
  cardinalite!: TypeCardinalite;

  @ApiPropertyOptional({ description: 'Libelle de la relation.', nullable: true, type: String })
  label?: string | null;

  @ApiProperty({ description: "Identifiant de l'entite source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'entite cible." })
  targetId!: string;
}
