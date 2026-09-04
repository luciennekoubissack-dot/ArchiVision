/* eslint-disable */
/* Manually maintained — matches ProcessusProgressionEntity from the API. */

export interface ObjectifProgressionItemEntity {
  id: string;
  nom: string;
  statut: string;
  solutionsTotal: number;
  solutionsTerminees: number;
  peutEtreMarqueAtteint: boolean;
}

export interface ProcessusProgressionEntity {
  processusId: string;
  totalElements: number;
  elementsAsIs: number;
  elementsToBe: number;
  elementsInchanges: number;
  /** Taux de transition en % : éléments LES_DEUX / total, arrondi. 100 = processus entièrement migré. */
  tauxTransition: number;
  objectifs: ObjectifProgressionItemEntity[];
}
