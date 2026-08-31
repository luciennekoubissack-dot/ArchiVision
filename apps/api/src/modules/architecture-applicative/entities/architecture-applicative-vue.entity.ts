import { ApiProperty } from '@nestjs/swagger';

/** Résultat de la génération de la vue d'architecture applicative (SVG) à
 * partir des éléments et flux existants. */
export class ArchitectureApplicativeVueEntity {
  @ApiProperty({ description: "Contenu SVG de la vue d'architecture applicative générée." })
  svg!: string;

  @ApiProperty({ description: "Nombre d'éléments représentés dans la vue." })
  elementCount!: number;

  @ApiProperty({ description: 'Nombre de flux représentés dans la vue.' })
  fluxCount!: number;
}
