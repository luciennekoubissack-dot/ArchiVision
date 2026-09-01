import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Position calculée pour un élément de diagramme. */
export class LayoutPositionEntity {
  @ApiProperty({ description: "Identifiant de l'élément repositionné." })
  id!: string;

  @ApiProperty({ description: 'Abscisse (px).' })
  positionX!: number;

  @ApiProperty({ description: 'Ordonnée (px).' })
  positionY!: number;
}

/** Résultat d'une génération de disposition automatique d'un diagramme. */
export class DiagramLayoutResultEntity {
  @ApiProperty({ type: () => LayoutPositionEntity, isArray: true, description: 'Éléments avec leurs nouvelles positions.' })
  elements!: LayoutPositionEntity[];

  @ApiProperty({ description: "Nombre d'éléments repositionnés." })
  count!: number;

  @ApiPropertyOptional({ description: 'Nombre de liens déduits automatiquement (diagramme de données uniquement).' })
  relationsInfereesCount?: number;
}
