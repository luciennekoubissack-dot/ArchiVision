export type DomaineSuggestion = 'objectifs' | 'metier' | 'donnees' | 'applicatif' | 'technologique';

export interface SuggestionToBeEntity {
  domaine: DomaineSuggestion;
  /** ID de l'élément AS-IS source. */
  refId: string;
  /** Nom de l'élément AS-IS. */
  nomSource: string;
  /** Libellé suggéré pour la cible TO-BE. */
  suggestion: string;
  /** Justification contextuelle. */
  justification: string;
}
