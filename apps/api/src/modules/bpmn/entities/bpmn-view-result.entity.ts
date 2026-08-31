import { ApiProperty } from '@nestjs/swagger';

/** Vue générée d'un processus BPMN, sous forme de SVG accompagné de quelques compteurs. */
export class BpmnViewResultEntity {
  @ApiProperty({ description: 'Contenu SVG du diagramme généré.' })
  svg!: string;

  @ApiProperty({ description: "Nombre d'éléments représentés dans le diagramme." })
  elementCount!: number;

  @ApiProperty({ description: 'Nombre de flux représentés dans le diagramme.' })
  flowCount!: number;
}
