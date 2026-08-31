import { ApiProperty } from '@nestjs/swagger';

/** Résultat de la génération de la vue d'organigramme des services (SVG). */
export class ServiceViewEntity {
  @ApiProperty({ description: "Contenu SVG de l'organigramme généré." })
  svg!: string;

  @ApiProperty({ description: 'Nombre de services représentés dans la vue.' })
  serviceCount!: number;

  @ApiProperty({ description: 'Nombre de membres représentés dans la vue.' })
  membreCount!: number;
}
