import { DeclencheurEvenement, TypeBpmn, TypeTache } from '@prisma/client';

/**
 * Construction d'une *proposition* de diagramme BPMN à partir des étapes
 * saisies en langage naturel. Volontairement déterministe et sans IA : le
 * résultat est un point de départ que l'utilisateur ajuste ensuite dans
 * l'éditeur (renommage, repositionnement, ajustement des branches).
 *
 * Syntaxe reconnue (une unité par ligne) :
 *
 *  - Étape simple : texte libre. La nature de la tâche (utilisateur / service /
 *    envoi / réception) est devinée par mots-clés.
 *
 *  - Décision : une ligne finissant par « ? » ou commençant par « Si »,
 *    « Selon », « Dans le cas »... Elle devient une passerelle exclusive.
 *    Les lignes suivantes préfixées par « = » en sont les branches :
 *        Le dossier est-il complet ?
 *        = Oui : Instruire la demande
 *        = Non : Réclamer les pièces ; Vérifier le dossier
 *    Le texte avant « : » est le libellé du flux, celui après « : » la ou les
 *    étapes de la branche (séparées par « ; »). Une passerelle de fusion est
 *    insérée automatiquement ; la première ligne sans « = » est le point de
 *    convergence.
 *
 *  - Boucle : une étape de branche écrite « → "Nom d'une étape déjà définie" »
 *    (ou « retour à "..." ») crée un flux de retour au lieu d'une nouvelle
 *    étape.
 *
 *  - Parallèle : une ligne « En parallèle : » suivie de branches « = ... »
 *    devient une passerelle parallèle (divergence + convergence).
 *
 * Limite assumée : pas de décision imbriquée (une branche qui contient
 * elle-même une ligne « ? »).
 */

export const MAX_ETAPES = 60;

export interface PropositionNoeud {
  nom: string;
  type: TypeBpmn;
  typeTache?: TypeTache;
  declencheur?: DeclencheurEvenement;
  x: number;
  y: number;
}

export interface PropositionLien {
  source: number;
  cible: number;
  label?: string;
}

export interface PropositionDiagramme {
  noeuds: PropositionNoeud[];
  liens: PropositionLien[];
}

const MARGE = 40;
const LIGNE_Y = 60;
const LARGEUR_COLONNE = 210;
const HAUTEUR_RANGEE = 140;

const MARQUEUR_LISTE_RE = /^\s*(?:[-*•·]|\d+[.)])\s+/;
const MARQUEUR_BRANCHE_RE = /^\s*[=>]\s+(.+)$/;
const ENTETE_PARALLELE_RE = /^\s*en parall[èe]le\s*:?\s*$/i;
const ENTETE_DECISION_RE = /^(si |s'il |s'ils |selon |suivant que |dans le cas|en cas de|est-ce que)/i;
const GOTO_RE =
  /^(?:→|->|=>|retour\s+(?:à|vers|au)|revenir\s+(?:à|vers|au)|aller\s+(?:à|vers|au))\s+["«»]?\s*(.+?)\s*["«»]?$/i;

interface Branche {
  label?: string;
  etapes: string[];
}

type Bloc =
  | { kind: 'etape'; texte: string; type?: TypeBpmn }
  | { kind: 'decision'; question: string; branches: Branche[] }
  | { kind: 'parallele'; branches: Branche[] };

/** Découpe le texte en étapes simples : une par ligne, puces / numéros retirés. */
export function decouperEtapes(brut: string): string[] {
  return brut
    .split(/\r?\n/)
    .map((ligne) => ligne.replace(MARQUEUR_LISTE_RE, '').trim())
    .filter((ligne) => ligne.length > 0);
}

/** Clé de comparaison souple entre le nom d'une étape et une cible de boucle. */
function normaliserPourComparaison(valeur: string): string {
  return valeur
    .trim()
    .toLowerCase()
    .replace(/["«»]/g, '')
    .replace(/[.;:!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

function cibleGoto(texte: string): string | null {
  const m = GOTO_RE.exec(texte.trim());
  return m ? m[1].trim() : null;
}

function estEnteteDecision(ligne: string): boolean {
  const t = ligne.trim();
  return t.endsWith('?') || ENTETE_DECISION_RE.test(t);
}

/** Devine la nature d'une tâche par mots-clés (jamais une passerelle : géré en amont). */
function classifierTache(ligne: string): { type: 'TACHE'; typeTache?: TypeTache } {
  const l = ligne.toLowerCase();

  const parleMessage = /\b(mail|e-?mail|courriel|message|notification|sms|courrier)\b/.test(l);
  if (parleMessage && /\b(envoi|envoie|envoyer|transmet|transmettre|notifie|notifier|relance|relancer|adresse)\b/.test(l)) {
    return { type: 'TACHE', typeTache: 'ENVOI' };
  }
  if (parleMessage && /\b(re[çc]oi\w*|recevoir|re[çc]u\w*|r[ée]ceptionn\w*|r[ée]ception|attend\w*)\b/.test(l)) {
    return { type: 'TACHE', typeTache: 'RECEPTION' };
  }
  if (
    /\b(valide|valider|v[ée]rifie\w*|v[ée]rifier|contr[ôo]le\w*|contr[ôo]ler|approuve\w*|approuver|saisi\w*|saisir|renseigne\w*|renseigner|compl[èe]te\w*|compl[ée]ter|remplit|remplir|consulte\w*|consulter|s[ée]lectionne\w*|choisi\w*|choisir|signe|signer)\b/.test(
      l,
    )
  ) {
    return { type: 'TACHE', typeTache: 'UTILISATEUR' };
  }
  if (
    /\b(calcul\w*|g[ée]n[èe]re\w*|g[ée]n[ée]rer|enregistre\w*|enregistrer|met[s]? à jour|mettre à jour|archive\w*|archiver|synchronise\w*|synchroniser|importe\w*|importer|exporte\w*|exporter|publie\w*|publier)\b/.test(
      l,
    )
  ) {
    return { type: 'TACHE', typeTache: 'SERVICE' };
  }
  return { type: 'TACHE' };
}

function collecterBranches(
  lignes: string[],
  depart: number,
  avecLabel: boolean,
): { branches: Branche[]; suite: number } {
  const branches: Branche[] = [];
  let i = depart;
  while (i < lignes.length) {
    const m = MARQUEUR_BRANCHE_RE.exec(lignes[i]);
    if (!m) break;
    const contenu = m[1].trim();

    let label: string | undefined;
    let reste: string;
    if (avecLabel) {
      const sep = contenu.indexOf(':');
      if (sep >= 0) {
        label = contenu.slice(0, sep).trim() || undefined;
        reste = contenu.slice(sep + 1);
      } else {
        label = contenu || undefined;
        reste = '';
      }
    } else {
      reste = contenu;
    }

    const etapes = reste
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    branches.push({ label, etapes });
    i += 1;
  }
  return { branches, suite: i };
}

function decouperBlocs(brut: string): Bloc[] {
  const lignes = brut
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim().length > 0);

  const blocs: Bloc[] = [];
  let i = 0;
  while (i < lignes.length) {
    const brute = lignes[i];

    if (MARQUEUR_BRANCHE_RE.test(brute)) {
      throw new Error(
        `Ligne « ${brute.trim()} » : une branche « = ... » doit suivre une ligne de décision (« ... ? ») ou « En parallèle : ».`,
      );
    }

    if (ENTETE_PARALLELE_RE.test(brute)) {
      const { branches, suite } = collecterBranches(lignes, i + 1, false);
      i = suite;
      if (branches.length < 2) {
        throw new Error('« En parallèle : » doit être suivi d\'au moins deux branches « = ... ».');
      }
      blocs.push({ kind: 'parallele', branches });
      continue;
    }

    const sansMarqueur = brute.replace(MARQUEUR_LISTE_RE, '');
    if (estEnteteDecision(sansMarqueur)) {
      const { branches, suite } = collecterBranches(lignes, i + 1, true);
      i = suite;
      const question = sansMarqueur.trim();
      if (branches.length === 0) {
        // Décision sans branche explicite : simple jalon, l'utilisateur reliera.
        blocs.push({ kind: 'etape', texte: question, type: 'PASSERELLE_EXCLUSIVE' });
      } else if (branches.length < 2) {
        throw new Error(`La décision « ${question} » doit avoir au moins deux branches « = ... ».`);
      } else {
        blocs.push({ kind: 'decision', question, branches });
      }
      continue;
    }

    blocs.push({ kind: 'etape', texte: sansMarqueur.trim() });
    i += 1;
  }
  return blocs;
}

function compterEtapes(blocs: Bloc[]): number {
  return blocs.reduce((total, bloc) => {
    if (bloc.kind === 'etape') return total + 1;
    return total + bloc.branches.reduce((n, br) => n + Math.max(br.etapes.length, 1), 0);
  }, 0);
}

/**
 * Placement en couches : la profondeur d'un nœud est la plus longue distance
 * depuis « Début » (les flux de retour, source après cible, sont ignorés). Les
 * nœuds d'une même profondeur sont empilés verticalement dans l'ordre de
 * création ; les branches d'une passerelle tombent donc sur des rangées
 * distinctes.
 */
function placerEnCouches(noeuds: PropositionNoeud[], liens: PropositionLien[]): void {
  const profondeur = new Array<number>(noeuds.length).fill(0);
  for (let passe = 0; passe < noeuds.length; passe += 1) {
    let change = false;
    for (const lien of liens) {
      if (lien.source >= lien.cible) continue; // flux de retour : hors calcul de couches
      const candidate = profondeur[lien.source] + 1;
      if (candidate > profondeur[lien.cible]) {
        profondeur[lien.cible] = candidate;
        change = true;
      }
    }
    if (!change) break;
  }

  const rangs = new Map<number, number>();
  for (let i = 0; i < noeuds.length; i += 1) {
    const p = profondeur[i];
    const rang = rangs.get(p) ?? 0;
    rangs.set(p, rang + 1);
    noeuds[i].x = MARGE + p * LARGEUR_COLONNE;
    noeuds[i].y = LIGNE_Y + rang * HAUTEUR_RANGEE;
  }
}

/**
 * @throws si aucune étape exploitable, si le nombre d'étapes dépasse
 *   {@link MAX_ETAPES}, ou si la syntaxe des branches est invalide. La mise en
 *   forme du message revient à l'appelant.
 */
export function construirePropositionDiagramme(etapesBrutes: string): PropositionDiagramme {
  const blocs = decouperBlocs(etapesBrutes);

  const total = compterEtapes(blocs);
  if (total === 0) {
    throw new Error("Aucune étape exploitable n'a été trouvée.");
  }
  if (total > MAX_ETAPES) {
    throw new Error(`Trop d'étapes : ${total} (maximum ${MAX_ETAPES}).`);
  }

  const noeuds: PropositionNoeud[] = [];
  const liens: PropositionLien[] = [];
  const parNom = new Map<string, number>();

  const ajouterNoeud = (nom: string, forme: Pick<PropositionNoeud, 'type' | 'typeTache'>): number => {
    noeuds.push({ nom, type: forme.type, typeTache: forme.typeTache, x: 0, y: 0 });
    const index = noeuds.length - 1;
    const cle = normaliserPourComparaison(nom);
    if (cle && !parNom.has(cle)) parNom.set(cle, index);
    return index;
  };
  const ajouterLien = (source: number, cible: number, label?: string): void => {
    liens.push({ source, cible, label: label || undefined });
  };
  const resoudreRetour = (texte: string): number | null => {
    const cible = cibleGoto(texte);
    if (cible == null) return null;
    const index = parNom.get(normaliserPourComparaison(cible));
    if (index == null) throw new Error(`Retour vers une étape inconnue : « ${cible} ».`);
    return index;
  };

  const debut = ajouterNoeud('Début', { type: 'EVENEMENT_DEBUT' });
  let entrees: number[] = [debut];

  for (const bloc of blocs) {
    if (bloc.kind === 'etape') {
      const forme = bloc.type ? { type: bloc.type } : classifierTache(bloc.texte);
      const noeud = ajouterNoeud(bloc.texte, forme);
      for (const e of entrees) ajouterLien(e, noeud);
      entrees = [noeud];
      continue;
    }

    if (bloc.kind === 'decision') {
      const passerelle = ajouterNoeud(bloc.question, { type: 'PASSERELLE_EXCLUSIVE' });
      for (const e of entrees) ajouterLien(e, passerelle);

      const versFusion: Array<{ source: number; label?: string }> = [];
      for (const branche of bloc.branches) {
        if (branche.etapes.length === 0) {
          versFusion.push({ source: passerelle, label: branche.label });
          continue;
        }
        let precedent = passerelle;
        let label = branche.label;
        let bouclee = false;
        for (const texte of branche.etapes) {
          const retour = resoudreRetour(texte);
          if (retour != null) {
            ajouterLien(precedent, retour, label);
            bouclee = true;
            break;
          }
          const noeud = ajouterNoeud(texte, classifierTache(texte));
          ajouterLien(precedent, noeud, label);
          label = undefined;
          precedent = noeud;
        }
        if (!bouclee) versFusion.push({ source: precedent });
      }

      if (versFusion.length === 0) {
        throw new Error(
          `La décision « ${bloc.question} » : au moins une branche doit poursuivre le flux (sans « → »).`,
        );
      }
      const fusion = ajouterNoeud('Fusion', { type: 'PASSERELLE_EXCLUSIVE' });
      for (const v of versFusion) ajouterLien(v.source, fusion, v.label);
      entrees = [fusion];
      continue;
    }

    // bloc.kind === 'parallele'
    const division = ajouterNoeud('Parallèle', { type: 'PASSERELLE_PARALLELE' });
    for (const e of entrees) ajouterLien(e, division);

    // La jonction est créée APRÈS les branches pour que son index reste
    // supérieur à celui de ses prédécesseurs (cf. placerEnCouches, qui traite
    // tout lien `source >= cible` comme un retour et l'ignore).
    const versJonction: number[] = [];
    for (const branche of bloc.branches) {
      let precedent = division;
      let bouclee = false;
      for (const texte of branche.etapes) {
        const retour = resoudreRetour(texte);
        if (retour != null) {
          ajouterLien(precedent, retour);
          bouclee = true;
          break;
        }
        const noeud = ajouterNoeud(texte, classifierTache(texte));
        ajouterLien(precedent, noeud);
        precedent = noeud;
      }
      if (!bouclee) versJonction.push(precedent);
    }
    const jonction = ajouterNoeud('Fusion', { type: 'PASSERELLE_PARALLELE' });
    for (const source of versJonction) ajouterLien(source, jonction);
    entrees = [jonction];
  }

  const fin = ajouterNoeud('Fin', { type: 'EVENEMENT_FIN' });
  for (const e of entrees) ajouterLien(e, fin);

  placerEnCouches(noeuds, liens);
  return { noeuds, liens };
}
