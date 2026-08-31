import { ApiProperty } from '@nestjs/swagger';
import { ElementArchimateEntity } from './element-archimate.entity';

/** Résultat de la génération de la vue ArchiMate (SVG) à partir des éléments
 * et relations existants. */
export class ArchimateViewEntity {
  @ApiProperty({ description: 'Contenu SVG de la vue ArchiMate générée.' })
  svg!: string;

  @ApiProperty({ description: "Nombre d'éléments représentés dans la vue." })
  elementCount!: number;

  @ApiProperty({ description: 'Nombre de relations représentées dans la vue.' })
  relationCount!: number;
}

/** Résultat de la génération et de la persistance automatique des positions
 * des éléments ArchiMate (auto-layout en grille). */
export class ArchimateLayoutEntity {
  @ApiProperty({
    type: () => ElementArchimateEntity,
    isArray: true,
    description: 'Éléments ArchiMate mis à jour avec leurs nouvelles positions.',
  })
  elements!: ElementArchimateEntity[];

  @ApiProperty({ description: "Nombre d'éléments repositionnés." })
  elementCount!: number;
}
