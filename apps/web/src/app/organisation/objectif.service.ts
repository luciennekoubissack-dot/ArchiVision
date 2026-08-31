import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ObjectifEntity } from '../api-client/models/objectif-entity';
import { CreateObjectifDto } from '../api-client/models/create-objectif-dto';
import { UpdateObjectifDto } from '../api-client/models/update-objectif-dto';
import { objectifControllerFindAll } from '../api-client/fn/objectifs/objectif-controller-find-all';
import { objectifControllerCreate } from '../api-client/fn/objectifs/objectif-controller-create';
import { objectifControllerUpdate } from '../api-client/fn/objectifs/objectif-controller-update';
import { objectifControllerRemove } from '../api-client/fn/objectifs/objectif-controller-remove';

export type Objectif = ObjectifEntity;
export type CreateObjectifPayload = CreateObjectifDto;
export type UpdateObjectifPayload = UpdateObjectifDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class ObjectifService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé par l'export Excel : a besoin de tous les objectifs. */
  list(): Observable<Objectif[]> {
    return objectifControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Objectif>> {
    return objectifControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Objectif>),
    );
  }

  create(payload: CreateObjectifPayload): Observable<Objectif> {
    return objectifControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateObjectifPayload): Observable<Objectif> {
    return objectifControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return objectifControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
