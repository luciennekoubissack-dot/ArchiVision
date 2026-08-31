import { ApiProperty } from '@nestjs/swagger';

/** Diagramme généré des zones d'urbanisation (hiérarchie Zone > Quartier > Îlot). */
export class UrbanisationVueEntity {
  @ApiProperty({ description: 'Contenu SVG du diagramme.' })
  svg!: string;

  @ApiProperty({ description: "Nombre de zones d'urbanisation représentées." })
  zoneCount!: number;

  @ApiProperty({ description: 'Nombre d\'applications représentées.' })
  applicationCount!: number;
}

/** Diagramme de composants UML généré (applications et échanges applicatifs). */
export class ComponentsVueEntity {
  @ApiProperty({ description: 'Contenu SVG du diagramme.' })
  svg!: string;

  @ApiProperty({ description: 'Nombre d\'applications représentées.' })
  applicationCount!: number;

  @ApiProperty({ description: 'Nombre d\'échanges applicatifs représentés.' })
  echangeCount!: number;
}
