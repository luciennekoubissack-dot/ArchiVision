import { ApiProperty } from '@nestjs/swagger';
import { TypeRelation } from '@prisma/client';
import { ElementRefEntity } from './element-archimate.entity';

/** Relation typée entre deux éléments ArchiMate, avec les références source
 * et cible (id, nom, type). */
export class RelationArchimateEntity {
  @ApiProperty({ description: 'Identifiant de la relation.' })
  id!: string;

  @ApiProperty({ enum: TypeRelation, description: 'Type de la relation ArchiMate.' })
  type!: TypeRelation;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  sourceId!: string;

  @ApiProperty({ type: () => ElementRefEntity, description: 'Élément source de la relation.' })
  source!: ElementRefEntity;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  targetId!: string;

  @ApiProperty({ type: () => ElementRefEntity, description: 'Élément cible de la relation.' })
  target!: ElementRefEntity;

  @ApiProperty({ description: 'Date de création de la relation.', type: String, format: 'date-time' })
  createdAt!: Date;
}
