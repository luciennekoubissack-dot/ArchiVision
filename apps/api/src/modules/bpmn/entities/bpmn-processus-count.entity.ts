import { ApiProperty } from '@nestjs/swagger';

/** Compteur de relations d'un processus BPMN (forme `_count` de Prisma). */
export class BpmnProcessusCountEntity {
  @ApiProperty({ description: "Nombre d'éléments rattachés au processus." })
  elements!: number;
}
