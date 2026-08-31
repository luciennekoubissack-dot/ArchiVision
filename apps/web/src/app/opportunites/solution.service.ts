import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { SolutionEntity } from '../api-client/models/solution-entity';
import { EvaluationScoreEntity } from '../api-client/models/evaluation-score-entity';
import { CreateSolutionDto } from '../api-client/models/create-solution-dto';
import { UpdateSolutionDto } from '../api-client/models/update-solution-dto';
import { ScoreItemDto } from '../api-client/models/score-item-dto';
import { solutionControllerFindAll } from '../api-client/fn/solutions/solution-controller-find-all';
import { solutionControllerCreate } from '../api-client/fn/solutions/solution-controller-create';
import { solutionControllerUpdate } from '../api-client/fn/solutions/solution-controller-update';
import { solutionControllerUpdateScores } from '../api-client/fn/solutions/solution-controller-update-scores';
import { solutionControllerRemove } from '../api-client/fn/solutions/solution-controller-remove';

export type StatutSolution = 'PROPOSEE' | 'RETENUE' | 'REJETEE';
export type AvancementSolution = 'NON_DEMARRE' | 'EN_COURS' | 'TERMINE' | 'BLOQUE';

export type EvaluationScore = EvaluationScoreEntity;
export type Solution = SolutionEntity;
export type CreateSolutionPayload = CreateSolutionDto;
export type UpdateSolutionPayload = UpdateSolutionDto;
export type ScoreItem = ScoreItemDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class SolutionService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé comme lignes de la matrice d'évaluation, comme graphique de comparaison et par la matrice de conformité (Gouvernance) : a besoin de toutes les solutions. */
  list(): Observable<Solution[]> {
    return solutionControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Solution>> {
    return solutionControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Solution>),
    );
  }

  create(payload: CreateSolutionPayload): Observable<Solution> {
    return solutionControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateSolutionPayload): Observable<Solution> {
    return solutionControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  updateScores(id: string, items: ScoreItem[]): Observable<Solution> {
    return solutionControllerUpdateScores(this.http, this.config.rootUrl, { id, body: { items } }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return solutionControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
