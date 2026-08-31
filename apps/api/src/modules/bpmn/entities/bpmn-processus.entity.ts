import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeProcessus } from '@prisma/client';

/** Processus BPMN, sans ses éléments ni ses compteurs (tel que renvoyé par create/update/delete). */
export class BpmnProcessusEntity {
  @ApiProperty({ description: 'Identifiant du processus BPMN.' })
  id!: string;

  @ApiProperty({ description: 'Nom du processus.' })
  nom!: string;

  @ApiPropertyOptional({ description: 'Description du processus.', nullable: true, type: String })
  description?: string | null;

  @ApiProperty({
    enum: TypeProcessus,
    description: 'Classification du processus dans la cartographie (métier, support ou pilotage).',
  })
  type!: TypeProcessus;

  @ApiPropertyOptional({ description: "Source XML bpmn-js du diagramme.", nullable: true, type: String })
  bpmnXml?: string | null;

  @ApiProperty({ description: "Identifiant de l'organisation propriétaire." })
  organisationId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour.', type: String, format: 'date-time' })
  updatedAt!: Date;
}
