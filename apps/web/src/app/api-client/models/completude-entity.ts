/* eslint-disable */
export interface DomaineCompletude {
  /** Nombre d'éléments AS-IS (baseline). */
  total: number;
  /** Nombre d'éléments ayant un correspondant TO-BE. */
  avecToBe: number;
  /** Pourcentage de couverture TO-BE (0–100). */
  pct: number;
}

/** Résultat de l'analyse de complétude AS-IS / TO-BE par domaine. */
export interface CompletudeSummary {
  objectifs: DomaineCompletude;
  metier: DomaineCompletude;
  donnees: DomaineCompletude;
  applicatif: DomaineCompletude;
  technologique: DomaineCompletude;
  /** Score de maturité global 0–100 (40% TO-BE moyen, 40% écarts couverts, 20% solutions terminées). */
  maturite: number;
}
