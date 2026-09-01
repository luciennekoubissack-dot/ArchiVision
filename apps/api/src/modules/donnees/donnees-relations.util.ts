/**
 * Déduction déterministe de relations d'entités à partir des attributs de type
 * clé étrangère (ex. un attribut `clientId` sur `Commande` implique une
 * relation `Client (1) vers (N) Commande`). Aucune IA.
 */

export interface EntityForInference {
  id: string;
  nom: string;
  attributs: { nom: string }[];
}

export interface ExistingRelation {
  sourceId: string;
  targetId: string;
}

export interface InferredRelation {
  /** Entité référencée, côté « 1 ». */
  sourceId: string;
  /** Entité portant l'attribut, côté « N ». */
  targetId: string;
  cardinalite: 'UN_A_PLUSIEURS';
  label: string;
}

/** Normalise pour comparaison : minuscules, sans accents, sans espaces/tirets/underscores. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

/** Enlève un « s » final pour rapprocher singulier/pluriel. */
function singular(value: string): string {
  return value.endsWith('s') ? value.slice(0, -1) : value;
}

/**
 * Extrait le radical d'un nom d'attribut s'il ressemble à une clé étrangère :
 * `xId`, `x_id`, `idX`, `id_x`, `xRef`. Renvoie null sinon.
 */
function foreignKeyStem(attrName: string): string | null {
  const n = normalize(attrName);
  let m = /^(.+?)(id|ref)$/.exec(n); // clientid, client_ref
  if (m && m[1].length >= 2) return m[1];
  m = /^(?:id|ref)(.+)$/.exec(n); // idclient
  if (m && m[1].length >= 2) return m[1];
  return null;
}

export function inferForeignKeyRelations(
  entities: EntityForInference[],
  existing: ExistingRelation[],
): InferredRelation[] {
  const byNorm = new Map<string, EntityForInference>();
  for (const e of entities) {
    byNorm.set(singular(normalize(e.nom)), e);
  }

  const pairExists = (a: string, b: string): boolean =>
    existing.some(
      (r) =>
        (r.sourceId === a && r.targetId === b) || (r.sourceId === b && r.targetId === a),
    );

  const result: InferredRelation[] = [];
  const seen = new Set<string>();

  for (const owner of entities) {
    for (const attr of owner.attributs) {
      const stem = foreignKeyStem(attr.nom);
      if (!stem) continue;
      const referenced = byNorm.get(singular(stem));
      if (!referenced || referenced.id === owner.id) continue;
      if (pairExists(referenced.id, owner.id)) continue;

      const key = `${referenced.id}->${owner.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        sourceId: referenced.id,
        targetId: owner.id,
        cardinalite: 'UN_A_PLUSIEURS',
        label: attr.nom,
      });
    }
  }

  return result;
}
