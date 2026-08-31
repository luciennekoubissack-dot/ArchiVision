import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { MembreEntity } from '../api-client/models/membre-entity';
import { CreateMembreDto } from '../api-client/models/create-membre-dto';
import { UpdateMembreDto } from '../api-client/models/update-membre-dto';
import { membresControllerFindAll } from '../api-client/fn/membres/membres-controller-find-all';
import { membresControllerCreate } from '../api-client/fn/membres/membres-controller-create';
import { membresControllerUpdate } from '../api-client/fn/membres/membres-controller-update';
import { membresControllerRemove } from '../api-client/fn/membres/membres-controller-remove';

export type Membre = MembreEntity;
export type CreateMembrePayload = CreateMembreDto;
export type UpdateMembrePayload = UpdateMembreDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class MembresService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé pour un simple comptage (ex. tableau de bord) : pas de pagination. */
  list(): Observable<Membre[]> {
    return membresControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Membre>> {
    return membresControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Membre>),
    );
  }

  create(payload: CreateMembrePayload): Observable<Membre> {
    return membresControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateMembrePayload): Observable<Membre> {
    return membresControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return membresControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
