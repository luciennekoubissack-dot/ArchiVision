import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';

/**
 * Ratios AS-IS / TO-BE pour un domaine architectural.
 * `total`   : nombre d'éléments AS-IS ou LES_DEUX (baseline)
 * `avecToBe`: nombre de ces éléments ayant au moins un successeur TO-BE déclaré,
 *             ou portant eux-mêmes le statut TO-BE ou LES_DEUX
 * `pct`     : pourcentage arrondi (0–100)
 */
export interface DomaineCompletude {
  total: number;
  avecToBe: number;
  pct: number;
}

export interface CompletudeSummary {
  objectifs: DomaineCompletude;
  metier: DomaineCompletude;
  donnees: DomaineCompletude;
  applicatif: DomaineCompletude;
  technologique: DomaineCompletude;
  /** Indicateur de maturité global 0–100 pondéré (voir calcul ci-dessous). */
  maturite: number;
}

/** Une suggestion TO-BE générée automatiquement pour un domaine. */
export interface SuggestionToBe {
  domaine: 'objectifs' | 'metier' | 'donnees' | 'applicatif' | 'technologique';
  refId: string;
  /** Nom de l'élément AS-IS source. */
  nomSource: string;
  /** Libellé suggéré pour la cible TO-BE. */
  suggestion: string;
  /** Justification contextuelle. */
  justification: string;
}

@Injectable()
export class CompletudService {
  constructor(private readonly prisma: PrismaService) {}

  async compute(organisationId: string): Promise<CompletudeSummary> {
    const [
      objectifsAsIs,
      objectifsAvecToBe,
      elementsAsIs,
      elementsAvecToBe,
      entitesAsIs,
      entitesAvecToBe,
      appsAsIs,
      appsAvecToBe,
      techAsIs,
      techAvecToBe,
      ecarts,
      solutionsLiees,
      solutionsTerminees,
    ] = await Promise.all([
      // ── Objectifs ──────────────────────────────────────────────────────────
      // Baseline = objectifs AS-IS
      this.prisma.objectif.count({ where: { organisationId, statut: 'AS_IS' } }),
      // Couvert = objectifs AS-IS qui ont au moins un successeur TO-BE
      this.prisma.objectif.count({
        where: {
          organisationId,
          statut: 'AS_IS',
          objectifsToBe: { some: {} },
        },
      }),

      // ── Architecture Métier (éléments ArchiMate) ──────────────────────────
      this.prisma.elementArchimate.count({ where: { organisationId, statut: { in: ['AS_IS', 'LES_DEUX'] } } }),
      this.prisma.elementArchimate.count({ where: { organisationId, statut: { in: ['TO_BE', 'LES_DEUX'] } } }),

      // ── Architecture Données ──────────────────────────────────────────────
      this.prisma.dataEntity.count({ where: { organisationId, statut: { in: ['AS_IS', 'LES_DEUX'] } } }),
      this.prisma.dataEntity.count({ where: { organisationId, statut: { in: ['TO_BE', 'LES_DEUX'] } } }),

      // ── Architecture Applicative ──────────────────────────────────────────
      this.prisma.application.count({ where: { organisationId, statut: { in: ['AS_IS', 'LES_DEUX'] } } }),
      this.prisma.application.count({ where: { organisationId, statut: { in: ['TO_BE', 'LES_DEUX'] } } }),

      // ── Architecture Technologique ────────────────────────────────────────
      this.prisma.techComponent.count({ where: { organisationId, statut: { in: ['AS_IS', 'LES_DEUX'] } } }),
      this.prisma.techComponent.count({ where: { organisationId, statut: { in: ['TO_BE', 'LES_DEUX'] } } }),

      // ── Couverture solutions (pour le score de maturité) ──────────────────
      // Nombre total d'écarts (éléments AS-IS ou Élimination potentielle)
      this.prisma.solutionGap.count({ where: { solution: { organisationId } } }),
      // Nombre d'écarts adressés par au moins une solution
      this.prisma.solutionGap.groupBy({ by: ['elementId'], where: { solution: { organisationId } } })
        .then((rows) => rows.length),
      // Solutions terminées
      this.prisma.solution.count({ where: { organisationId, statut: 'RETENUE', avancement: 'TERMINE' } }),
    ]);

    const objectifs = this.ratio(objectifsAsIs, objectifsAvecToBe);
    const metier = this.ratio(elementsAsIs, elementsAvecToBe);
    const donnees = this.ratio(entitesAsIs, entitesAvecToBe);
    const applicatif = this.ratio(appsAsIs, appsAvecToBe);
    const technologique = this.ratio(techAsIs, techAvecToBe);

    // Couverture solutions
    const pctEcartsCouvert = ecarts > 0 ? Math.round((solutionsLiees / ecarts) * 100) : 0;

    // Solutions terminées / solutions retenues totales
    const totalRetenues = await this.prisma.solution.count({ where: { organisationId, statut: 'RETENUE' } });
    const pctSolTerminees = totalRetenues > 0 ? Math.round((solutionsTerminees / totalRetenues) * 100) : 0;

    // Score global pondéré :
    // 40% = moyenne des 5 ratios TO-BE
    // 40% = couverture des écarts par des solutions
    // 20% = avancement des solutions retenues
    const avgToBe = Math.round((objectifs.pct + metier.pct + donnees.pct + applicatif.pct + technologique.pct) / 5);
    const maturite = Math.round(avgToBe * 0.4 + pctEcartsCouvert * 0.4 + pctSolTerminees * 0.2);

    return { objectifs, metier, donnees, applicatif, technologique, maturite };
  }

  /**
   * Génère des suggestions TO-BE pour les éléments AS-IS sans cible TO-BE déclarée,
   * en s'appuyant sur la vision de l'organisation et les problèmes à résoudre.
   *
   * Les suggestions sont purement déterministes (pas d'IA) : elles proposent
   * de créer une version améliorée de chaque élément AS-IS en ajoutant une
   * mention "Optimisé" ou un qualificatif contextuel tiré de la vision.
   */
  async generateSuggestionsToBe(organisationId: string): Promise<SuggestionToBe[]> {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { vision: true, problemesResoudre: true, nom: true },
    });

    // Mots-clés tirés de la vision pour contextualiser les suggestions
    const visionKeywords = this.extractKeywords(
      `${organisation?.vision ?? ''} ${organisation?.problemesResoudre ?? ''}`,
    );
    const visionHint = visionKeywords.length > 0
      ? `en lien avec : ${visionKeywords.slice(0, 3).join(', ')}`
      : 'aligné sur la cible stratégique';

    const suggestions: SuggestionToBe[] = [];

    // ── Objectifs AS-IS sans successeur TO-BE ────────────────────────────────
    const objectifsSansEvolution = await this.prisma.objectif.findMany({
      where: { organisationId, statut: 'AS_IS', objectifsToBe: { none: {} } },
      select: { id: true, nom: true, description: true },
      take: 10,
    });
    for (const o of objectifsSansEvolution) {
      suggestions.push({
        domaine: 'objectifs',
        refId: o.id,
        nomSource: o.nom,
        suggestion: `${o.nom} — version TO-BE optimisée`,
        justification: `L'objectif « ${o.nom} » n'a pas encore de cible TO-BE. Proposez une version améliorée ${visionHint}.`,
      });
    }

    // ── Éléments ArchiMate AS-IS ──────────────────────────────────────────────
    const elementsSansEvolution = await this.prisma.elementArchimate.findMany({
      where: { organisationId, statut: 'AS_IS' },
      select: { id: true, nom: true, type: true },
      take: 10,
    });
    for (const e of elementsSansEvolution) {
      suggestions.push({
        domaine: 'metier',
        refId: e.id,
        nomSource: e.nom,
        suggestion: `${e.nom} (TO-BE — rationalisé)`,
        justification: `L'élément métier « ${e.nom} » (${e.type}) est uniquement AS-IS. Créez sa version TO-BE rationalisée ${visionHint}.`,
      });
    }

    // ── DataEntity AS-IS ──────────────────────────────────────────────────────
    const entitesSansEvolution = await this.prisma.dataEntity.findMany({
      where: { organisationId, statut: 'AS_IS' },
      select: { id: true, nom: true },
      take: 10,
    });
    for (const d of entitesSansEvolution) {
      suggestions.push({
        domaine: 'donnees',
        refId: d.id,
        nomSource: d.nom,
        suggestion: `${d.nom} — Entité TO-BE normalisée`,
        justification: `L'entité de données « ${d.nom} » n'a pas de cible TO-BE. Définissez sa forme normalisée/cible ${visionHint}.`,
      });
    }

    // ── Applications AS-IS ────────────────────────────────────────────────────
    const appsSansEvolution = await this.prisma.application.findMany({
      where: { organisationId, statut: 'AS_IS' },
      select: { id: true, nom: true },
      take: 10,
    });
    for (const a of appsSansEvolution) {
      suggestions.push({
        domaine: 'applicatif',
        refId: a.id,
        nomSource: a.nom,
        suggestion: `${a.nom} v2 (TO-BE)`,
        justification: `L'application « ${a.nom} » est uniquement AS-IS. Proposez sa version cible modernisée ${visionHint}.`,
      });
    }

    // ── TechComponents AS-IS ──────────────────────────────────────────────────
    const techSansEvolution = await this.prisma.techComponent.findMany({
      where: { organisationId, statut: 'AS_IS' },
      select: { id: true, nom: true, type: true },
      take: 10,
    });
    for (const t of techSansEvolution) {
      suggestions.push({
        domaine: 'technologique',
        refId: t.id,
        nomSource: t.nom,
        suggestion: `${t.nom} — Composant TO-BE cible`,
        justification: `Le composant technologique « ${t.nom} » (${t.type}) n'a pas de cible TO-BE. Définissez sa version cible ${visionHint}.`,
      });
    }

    return suggestions;
  }

  /** Extrait les mots significatifs (longueur > 4) d'un texte libre. */
  private extractKeywords(text: string): string[] {
    return [...new Set(
      text
        .toLowerCase()
        .replace(/[^a-zàâäéèêëîïôùûüç\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4),
    )].slice(0, 10);
  }

  private ratio(total: number, avecToBe: number): DomaineCompletude {
    const capped = Math.min(avecToBe, total); // LES_DEUX compte dans les deux
    return {
      total,
      avecToBe: capped,
      pct: total > 0 ? Math.round((capped / total) * 100) : 0,
    };
  }
}
