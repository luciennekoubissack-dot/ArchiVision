import { ApiProperty } from '@nestjs/swagger';
import { BpmnElementEntity } from './bpmn-element.entity';
import { BpmnFlowEntity } from './bpmn-flow.entity';

/** Élément BPMN enrichi de ses flux entrants et sortants, tel que renvoyé dans le détail d'un processus. */
export class BpmnElementWithFlowsEntity extends BpmnElementEntity {
  @ApiProperty({ type: () => [BpmnFlowEntity], description: 'Flux dont cet élément est la source.' })
  flowsSource!: BpmnFlowEntity[];

  @ApiProperty({ type: () => [BpmnFlowEntity], description: 'Flux dont cet élément est la cible.' })
  flowsTarget!: BpmnFlowEntity[];
}
