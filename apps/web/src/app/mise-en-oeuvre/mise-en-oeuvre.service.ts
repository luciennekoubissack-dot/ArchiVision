import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AvancementSolution, Solution, SolutionService } from '../opportunites/solution.service';
import { Projet, RoadmapService } from '../roadmap/roadmap.service';

/** Vue agrégée : solution retenue + projets roadmap liés (même nom ou association). */
export interface SuiviSolution {
  solution: Solution;
  projetsLies: Projet[];
}

/** KPIs de mise en œuvre. */
export interface MiseEnOeuvreStats {
  total: number;
  nonDemarre: number;
  enCours: number;
  termine: number;
  bloque: number;
  tauxAvancement: number; // % de solutions TERMINEE / total
}

/**
 * Service de mise en œuvre — agrège les données de SolutionService et
 * RoadmapService pour produire la vue de suivi de déploiement des solutions
 * retenues. Pas de route dédiée côté backend : le service est pur composition
 * frontend car toutes les données nécessaires existent déjà.
 */
@Injectable({ providedIn: 'root' })
export class MiseEnOeuvreService {
  constructor(
    private readonly solutionService: SolutionService,
    private readonly roadmapService: RoadmapService,
  ) {}

  /** Charge les solutions retenues et les projets, puis agrège les données. */
  loadSuivi(): Observable<{ suivi: SuiviSolution[]; stats: MiseEnOeuvreStats }> {
    return combineLatest([
      this.solutionService.list(),
      this.roadmapService.list(),
    ]).pipe(
      map(([solutions, projets]) => {
        const retenues = solutions.filter((s) => s.statut === 'RETENUE');

        // Association heuristique : un projet est "lié" à une solution si
        // son nom contient le nom de la solution (insensible à la casse) ou
        // inversement. Suffisant pour le MVP ; un lien explicite en base
        // serait la prochaine évolution naturelle de ce module.
        const suivi: SuiviSolution[] = retenues.map((solution) => ({
          solution,
          projetsLies: projets.filter((p) =>
            p.nom.toLowerCase().includes(solution.nom.toLowerCase()) ||
            solution.nom.toLowerCase().includes(p.nom.toLowerCase()),
          ),
        }));

        const stats = this.computeStats(retenues);
        return { suivi, stats };
      }),
    );
  }

  updateAvancement(id: string, avancement: AvancementSolution, commentaireSuivi?: string): Observable<Solution> {
    return this.solutionService.update(id, { avancement, commentaireSuivi });
  }

  private computeStats(solutions: Solution[]): MiseEnOeuvreStats {
    const total = solutions.length;
    const nonDemarre = solutions.filter((s) => s.avancement === 'NON_DEMARRE').length;
    const enCours = solutions.filter((s) => s.avancement === 'EN_COURS').length;
    const termine = solutions.filter((s) => s.avancement === 'TERMINE').length;
    const bloque = solutions.filter((s) => s.avancement === 'BLOQUE').length;
    const tauxAvancement = total > 0 ? Math.round((termine / total) * 100) : 0;
    return { total, nonDemarre, enCours, termine, bloque, tauxAvancement };
  }
}
