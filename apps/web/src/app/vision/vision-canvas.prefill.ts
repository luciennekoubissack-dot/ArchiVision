import { UpdateVisionCanvasPayload } from './vision-canvas.service';

/** Sous-ensemble des champs d'organisation utilisés pour le pré-remplissage. */
export interface PrefillOrganisation {
  vision?: string | null;
  problemesResoudre?: string | null;
  description?: string | null;
  secteur?: string | null;
}

export interface PrefillObjectif {
  nom: string;
  description?: string | null;
}

export interface PrefillPartiePrenante {
  nom: string;
  role?: string | null;
}

const clean = (v?: string | null): string => (v ?? '').trim();

/**
 * Construit un pré-remplissage déterministe du diagramme de vision (canevas
 * 8 blocs) à partir des données déjà saisies pour l'organisation. Ne renseigne
 * que les blocs pour lesquels une donnée existe ; les autres restent vides et
 * pourront être complétés à la main.
 */
export function buildVisionCanvasPrefill(
  org: PrefillOrganisation,
  objectifs: PrefillObjectif[],
  parties: PrefillPartiePrenante[],
): UpdateVisionCanvasPayload {
  const payload: UpdateVisionCanvasPayload = {};

  // Needs ← problèmes à résoudre
  const needs = clean(org.problemesResoudre);
  if (needs) payload.needs = needs;

  // Business Goals ← vision + objectifs stratégiques
  const goals: string[] = [];
  if (clean(org.vision)) goals.push(clean(org.vision));
  for (const o of objectifs) {
    const nom = clean(o.nom);
    if (!nom) continue;
    const desc = clean(o.description);
    goals.push(desc ? `${nom} : ${desc}` : nom);
  }
  if (goals.length) payload.businessGoals = goals.join('\n');

  // Target Group ← parties prenantes
  const cibles = parties
    .map((p) => {
      const nom = clean(p.nom);
      if (!nom) return '';
      const role = clean(p.role);
      return role ? `${nom} (${role})` : nom;
    })
    .filter(Boolean);
  if (cibles.length) payload.targetGroup = cibles.join('\n');

  // Competitors ← parties prenantes dont le rôle évoque un concurrent
  const concurrents = parties
    .filter((p) => /concurrent/i.test(clean(p.role)))
    .map((p) => clean(p.nom))
    .filter(Boolean);
  if (concurrents.length) payload.competitors = concurrents.join('\n');

  // Product ← description de l'organisation, sinon secteur
  const product = clean(org.description) || clean(org.secteur);
  if (product) payload.product = product;

  return payload;
}
