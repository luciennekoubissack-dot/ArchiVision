import { ApiProperty } from '@nestjs/swagger';
import { BpmnProcessusEntity } from './bpmn-processus.entity';
import { BpmnElementWithFlowsEntity } from './bpmn-element-with-flows.entity';

/** Processus BPMN avec le détail complet de ses éléments et de leurs flux. */
export class BpmnProcessusDetailEntity extends BpmnProcessusEntity {
  @ApiProperty({ type: () => [BpmnElementWithFlowsEntity], description: 'Éléments du processus, avec leurs flux.' })
  elements!: BpmnElementWithFlowsEntity[];
}
