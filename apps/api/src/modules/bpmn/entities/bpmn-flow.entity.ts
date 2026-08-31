import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Flux de séquence entre deux éléments BPMN (ex. tâche vers passerelle). */
export class BpmnFlowEntity {
  @ApiProperty({ description: 'Identifiant du flux BPMN.' })
  id!: string;

  @ApiPropertyOptional({ description: 'Libellé affiché sur le flux.', nullable: true, type: String })
  label?: string | null;

  @ApiProperty({ description: "Identifiant de l'élément source." })
  sourceId!: string;

  @ApiProperty({ description: "Identifiant de l'élément cible." })
  targetId!: string;
}
