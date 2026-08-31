import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { PolitiqueEntity } from '../api-client/models/politique-entity';
import { CreatePolitiqueDto } from '../api-client/models/create-politique-dto';
import { politiqueControllerFindAll } from '../api-client/fn/politiques-gouvernance/politique-controller-find-all';
import { politiqueControllerCreate } from '../api-client/fn/politiques-gouvernance/politique-controller-create';
import { politiqueControllerRemove } from '../api-client/fn/politiques-gouvernance/politique-controller-remove';

export type Politique = PolitiqueEntity;
export type CreatePolitiquePayload = CreatePolitiqueDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class PolitiqueService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé comme en-têtes de colonnes de la matrice de conformité : a besoin de toutes les politiques. */
  list(): Observable<Politique[]> {
    return politiqueControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Politique>> {
    return politiqueControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Politique>),
    );
  }

  create(payload: CreatePolitiquePayload): Observable<Politique> {
    return politiqueControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return politiqueControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
