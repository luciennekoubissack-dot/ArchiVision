import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Objectif, ObjectifService } from '../organisation/objectif.service';
import { ArchimateService } from '../architecture-metier/archimate.service';
import { DonneesService } from '../donnees/donnees.service';
import { UrbanisationService } from '../urbanisation/urbanisation.service';
import { TechnologieService } from '../technologie/technologie.service';
import { DomaineEcart } from '../opportunites/solution.service';

export type DomainTab = 'objectifs' | 'metier' | 'donnees' | 'applicatif' | 'technologique';

/** Correspondance entre l'onglet de domaine (Analyse des écarts) et l'enum `DomaineEcart` du lien Solution↔écart (Opportunités & solutions). */
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

/** Une ligne de la matrice d'écarts TOGAF : un élément AS-IS et/ou TO-BE, avec son état de transition. */
export interface GapRow {
  asIs: GapItem | null;
  toBe: GapItem[];
  etat: 'Conservé' | 'Éliminé' | 'Modifié' | 'Nouveau';
}

export const DOMAIN_LABEL: Record<DomainTab, string> = {
  objectifs: 'Objectifs',
  metier: 'Architecture métier',
  donnees: 'Données',
  applicatif: 'Applicatif',
  technologique: 'Technologique',
};

/**
 * Construit les matrices d'écarts TOGAF (Baseline AS-IS / Target TO-BE /
 * État) pour les 5 domaines qui portent un `statut` AS_IS/TO_BE/LES_DEUX.
 * Partagé entre Analyse des écarts (affichage) et Opportunités & solutions
 * (sélection de l'écart adressé par une solution), pour ne calculer cette
 * logique qu'à un seul endroit.
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
   * Matrice d'écarts TOGAF pour les objectifs : une ligne par objectif AS-IS
   * (conservé, éliminé ou modifié selon qu'il a ou non une évolution TO-BE
   * déclarée), plus une ligne par objectif TO-BE sans origine déclarée
   * (nouveau). Seuls les objectifs portent un lien d'évolution explicite
   * (`objectifAsIsId`) : c'est le seul domaine qui peut produire l'état
   * « Modifié ».
   */
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

  /**
   * Matrice d'écarts générique pour les domaines sans lien d'évolution
   * explicite (architecture métier, données, applicatif, technologique) :
   * LES_DEUX → Conservé, AS_IS → Éliminé, TO_BE → Nouveau. Sans donnée de
   * correspondance entre un élément AS-IS précis et son successeur TO-BE,
   * l'état « Modifié » n'est pas déductible pour ces domaines.
   */
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
