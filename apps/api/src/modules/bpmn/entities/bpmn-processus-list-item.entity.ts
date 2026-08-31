import { ApiProperty } from '@nestjs/swagger';
import { BpmnProcessusEntity } from './bpmn-processus.entity';
import { BpmnProcessusCountEntity } from './bpmn-processus-count.entity';

/** Processus BPMN tel que renvoyé dans la liste, avec le compteur de ses éléments. */
export class BpmnProcessusListItemEntity extends BpmnProcessusEntity {
  @ApiProperty({ type: () => BpmnProcessusCountEntity, description: "Compteurs des relations du processus." })
  _count!: BpmnProcessusCountEntity;
}
