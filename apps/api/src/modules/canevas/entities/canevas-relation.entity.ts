import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ElementKind, TypeRelation } from '@prisma/client';

/** Relation entre deux éléments du canevas, potentiellement de couches
 * différentes (ArchiMate, Application, composant technique, entité de
 * données). Aucune référence n'est incluse : seuls les identifiants et la
 * nature (`kind`) de la source et de la cible sont renvoyés. */
export class CanevasRelationEntity {
  @ApiProperty({ description: 'Identifiant de la relation du canevas.' })
  id!: string;

  @ApiProperty({ enum: TypeRelation, description: 'Type de relation entre les deux éléments du canevas.' })
  type!: TypeRelation;

  @ApiPropertyOptional({ description: 'Annotation libre (ex. type de lien réseau pour le diagramme de déploiement).' })
  label?: string | null;

  @ApiProperty({ enum: ElementKind, description: "Nature de l'élément source (type de brique du canevas)." })
  sourceKind!: ElementKind;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  sourceId!: string;

  @ApiProperty({ enum: ElementKind, description: "Nature de l'élément cible (type de brique du canevas)." })
  targetKind!: ElementKind;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  targetId!: string;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création de la relation.', type: String, format: 'date-time' })
  createdAt!: Date;
}
