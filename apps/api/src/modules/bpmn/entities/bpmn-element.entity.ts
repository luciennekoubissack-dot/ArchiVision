import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeclencheurEvenement, StatutElement, TypeBpmn, TypeTache } from '@prisma/client';

/** Élément d'un diagramme BPMN (événement, tâche, passerelle ou sous-processus). */
export class BpmnElementEntity {
  @ApiProperty({ description: "Identifiant de l'élément BPMN." })
  id!: string;

  @ApiProperty({ description: "Nom de l'élément." })
  nom!: string;

  @ApiProperty({ enum: TypeBpmn, description: "Type de l'élément BPMN." })
  type!: TypeBpmn;

  @ApiPropertyOptional({
    enum: DeclencheurEvenement,
    description: "Déclencheur de l'événement, pertinent uniquement pour un type événement.",
    nullable: true,
  })
  declencheur?: DeclencheurEvenement | null;

  @ApiPropertyOptional({
    enum: TypeTache,
    description: 'Nature de la tâche, pertinente uniquement pour le type TACHE.',
    nullable: true,
  })
  typeTache?: TypeTache | null;

  @ApiProperty({ enum: StatutElement, description: "Statut de l'élément dans la cartographie AS_IS / TO_BE." })
  statut!: StatutElement;

  @ApiPropertyOptional({ description: 'Position horizontale enregistrée dans l\'éditeur.', nullable: true, type: Number })
  positionX?: number | null;

  @ApiPropertyOptional({ description: 'Position verticale enregistrée dans l\'éditeur.', nullable: true, type: Number })
  positionY?: number | null;

  @ApiProperty({ description: 'Identifiant du processus BPMN parent.' })
  processusId!: string;

  @ApiProperty({ description: 'Date de création.', type: String, format: 'date-time' })
  createdAt!: Date;
}
