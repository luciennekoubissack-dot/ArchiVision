import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { CritereEvaluationEntity } from '../api-client/models/critere-evaluation-entity';
import { CreateCritereEvaluationDto } from '../api-client/models/create-critere-evaluation-dto';
import { critereEvaluationControllerFindAll } from '../api-client/fn/criteres-evaluation/critere-evaluation-controller-find-all';
import { critereEvaluationControllerCreate } from '../api-client/fn/criteres-evaluation/critere-evaluation-controller-create';
import { critereEvaluationControllerRemove } from '../api-client/fn/criteres-evaluation/critere-evaluation-controller-remove';

export type CritereEvaluation = CritereEvaluationEntity;
export type CreateCritereEvaluationPayload = CreateCritereEvaluationDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class CritereEvaluationService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  list(): Observable<CritereEvaluation[]> {
    return critereEvaluationControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  create(payload: CreateCritereEvaluationPayload): Observable<CritereEvaluation> {
    return critereEvaluationControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return critereEvaluationControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
