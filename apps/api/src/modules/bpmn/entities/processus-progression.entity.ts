import { ApiProperty } from '@nestjs/swagger';

/** Objectif lié à un processus, avec son état de progression. */
export class ObjectifProgressionItemEntity {
  @ApiProperty({ description: "Identifiant de l'objectif." })
  id!: string;

  @ApiProperty({ description: "Nom de l'objectif." })
  nom!: string;

  @ApiProperty({ description: "Statut courant de l'objectif (AS_IS, TO_BE ou LES_DEUX)." })
  statut!: string;

  @ApiProperty({ description: "Nombre de solutions liées aux écarts de cet objectif." })
  solutionsTotal!: number;

  @ApiProperty({ description: "Nombre de solutions ayant avancement = TERMINEE." })
  solutionsTerminees!: number;

  @ApiProperty({
    description:
      "Vrai si toutes les solutions liées sont TERMINEE et qu'il y en a au moins une — l'objectif peut être marqué comme atteint (passage AS_IS → LES_DEUX).",
  })
  peutEtreMarqueAtteint!: boolean;
}

/** Progression d'un processus BPMN : éléments à faire évoluer, éléments nouveaux, objectifs visés. */
export class ProcessusProgressionEntity {
  @ApiProperty({ description: "Identifiant du processus." })
  processusId!: string;

  @ApiProperty({ description: "Nombre total d'éléments du processus." })
  totalElements!: number;

  @ApiProperty({ description: "Nombre d'éléments AS_IS exclusifs (à faire évoluer)." })
  elementsAsIs!: number;

  @ApiProperty({ description: "Nombre d'éléments TO_BE exclusifs (à créer)." })
  elementsToBe!: number;

  @ApiProperty({ description: "Nombre d'éléments LES_DEUX (inchangés)." })
  elementsInchanges!: number;

  @ApiProperty({
    description:
      "Taux de transition en pourcentage : éléments LES_DEUX / total, arrondi. 100 = processus entièrement migré.",
  })
  tauxTransition!: number;

  @ApiProperty({
    type: () => [ObjectifProgressionItemEntity],
    description: "Objectifs stratégiques visés par ce processus, avec leur état de progression.",
  })
  objectifs!: ObjectifProgressionItemEntity[];
}
