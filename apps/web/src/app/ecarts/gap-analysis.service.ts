import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Objectif, ObjectifService } from '../organisation/objectif.service';
import { ArchimateService } from '../architecture-metier/archimate.service';
import { DonneesService } from '../donnees/donnees.service';
import { UrbanisationService } from '../urbanisation/urbanisation.service';
import { TechnologieService } from '../technologie/technologie.service';
import { DomaineEcart, SolutionGap } from '../opportunites/solution.service';

export type DomainTab = 'objectifs' | 'metier' | 'donnees' | 'applicatif' | 'technologique';

/** Correspondance entre l'onglet de domaine (Analyse des écarts) et l'enum `DomaineEcart`. */
export const DOMAIN_TO_DOMAINE_ECART: Record<DomainTab, DomaineEcart> = {
  objectifs: 'OBJECTIF',
  metier: 'METIER',
  donnees: 'DONNEES',
  applicatif: 'APPLICATIF',
  technologique: 'TECHNOLOGIQUE',
};

/** Élément minimal nécessaire pour figurer dans une matrice d'écarts (id + libellé). */
export interface GapItem {
  id: string;
  nom: string;
}

/**
 * État d'un écart dans la matrice TOGAF.
 * - Conservé : élément inchangé entre AS-IS et TO-BE.
 * - Éliminé : élément AS-IS sans évolution déclarée.
 * - Modifié : élément AS-IS avec une ou plusieurs évolutions TO-BE déclarées.
 * - Nouveau : élément TO-BE sans origine AS-IS déclarée.
 * - Réalisé : état Éliminé ou Modifié dont toutes les solutions liées sont TERMINEE.
 */
export type EtatGap = 'Conservé' | 'Éliminé' | 'Modifié' | 'Nouveau' | 'Réalisé';

/** Une ligne de la matrice d'écarts TOGAF. */
export interface GapRow {
  asIs: GapItem | null;
  toBe: GapItem[];
  etat: EtatGap;
}

export const DOMAIN_LABEL: Record<DomainTab, string> = {
  objectifs: 'Objectifs',
  metier: 'Architecture métier',
  donnees: 'Données',
  applicatif: 'Applicatif',
  technologique: 'Technologique',
};

/**
 * Construit les matrices d'écarts TOGAF (Baseline AS-IS / Target TO-BE / État)
 * pour les 5 domaines portant un `statut` AS_IS/TO_BE/LES_DEUX.
 * Partagé entre Analyse des écarts et Opportunités & solutions.
 */
@Injectable({ providedIn: 'root' })
export class GapAnalysisService {
  constructor(
    private objectifService: ObjectifService,
    private archimateService: ArchimateService,
    private donneesService: DonneesService,
    private urbanisationService: UrbanisationService,
    private technologieService: TechnologieService,
  ) {}

  rowsFor(domain: DomainTab): Observable<GapRow[]> {
    if (domain === 'objectifs') {
      return this.objectifService.list().pipe(map((objectifs) => this.buildObjectifRows(objectifs)));
    }
    if (domain === 'metier') {
      return this.archimateService.listElements().pipe(map((elements) => this.buildSimpleGapRows(elements)));
    }
    if (domain === 'donnees') {
      return this.donneesService.list().pipe(map((entites) => this.buildSimpleGapRows(entites)));
    }
    if (domain === 'applicatif') {
      return this.urbanisationService.listApplications().pipe(map((applications) => this.buildSimpleGapRows(applications)));
    }
    return this.technologieService.list().pipe(map((composants) => this.buildSimpleGapRows(composants)));
  }

  /**
   * Applique l'état "Réalisé" aux lignes dont toutes les solutions liées sont TERMINEE.
   * À appeler après avoir récupéré les gaps via SolutionService.listGaps().
   */
  applyRealise(rows: GapRow[], allGaps: SolutionGap[], domaine: DomaineEcart): GapRow[] {
    return rows.map((row) => {
      // Seules les lignes Éliminé ou Modifié peuvent devenir Réalisé
      if (row.etat !== 'Éliminé' && row.etat !== 'Modifié') return row;

      const targets = row.toBe.length > 0 ? row.toBe : row.asIs ? [row.asIs] : [];
      const solutionsLiees = targets.flatMap((t) =>
        allGaps.filter((g) => g.domaine === domaine && g.elementId === t.id),
      );

      if (solutionsLiees.length === 0) return row;

      const toutesTerminees = solutionsLiees.every(
        (g) => (g.solution as { avancement?: string })?.avancement === 'TERMINEE',
      );
      if (toutesTerminees) {
        return { ...row, etat: 'Réalisé' as EtatGap };
      }
      return row;
    });
  }

  private buildObjectifRows(objectifs: Objectif[]): GapRow[] {
    const rows: GapRow[] = [];

    for (const o of objectifs.filter((o) => o.statut === 'LES_DEUX')) {
      rows.push({ asIs: o, toBe: [o], etat: 'Conservé' });
    }
    for (const o of objectifs.filter((o) => o.statut === 'AS_IS')) {
      const evolutions = o.objectifsToBe ?? [];
      rows.push({ asIs: o, toBe: evolutions, etat: evolutions.length > 0 ? 'Modifié' : 'Éliminé' });
    }
    for (const o of objectifs.filter((o) => o.statut === 'TO_BE' && !o.objectifAsIsId)) {
      rows.push({ asIs: null, toBe: [o], etat: 'Nouveau' });
    }

    return rows;
  }

  private buildSimpleGapRows(items: { id: string; nom: string; statut: string }[]): GapRow[] {
    const rows: GapRow[] = [];
    for (const item of items.filter((i) => i.statut === 'LES_DEUX')) {
      rows.push({ asIs: item, toBe: [item], etat: 'Conservé' });
    }
    for (const item of items.filter((i) => i.statut === 'AS_IS')) {
      rows.push({ asIs: item, toBe: [], etat: 'Éliminé' });
    }
    for (const item of items.filter((i) => i.statut === 'TO_BE')) {
      rows.push({ asIs: null, toBe: [item], etat: 'Nouveau' });
    }
    return rows;
  }
}
