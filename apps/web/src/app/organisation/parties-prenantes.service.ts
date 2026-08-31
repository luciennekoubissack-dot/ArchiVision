import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { PartiePrenanteEntity } from '../api-client/models/partie-prenante-entity';
import { CreatePartiePrenanteDto } from '../api-client/models/create-partie-prenante-dto';
import { partiesPrenantesControllerFindAll } from '../api-client/fn/parties-prenantes/parties-prenantes-controller-find-all';
import { partiesPrenantesControllerCreate } from '../api-client/fn/parties-prenantes/parties-prenantes-controller-create';
import { partiesPrenantesControllerRemove } from '../api-client/fn/parties-prenantes/parties-prenantes-controller-remove';

export type PartiePrenante = PartiePrenanteEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class PartiesPrenantesService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé par l'export Excel : a besoin de toutes les parties prenantes. */
  list(): Observable<PartiePrenante[]> {
    return partiesPrenantesControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<PartiePrenante>> {
    return partiesPrenantesControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<PartiePrenante>),
    );
  }

  create(payload: CreatePartiePrenanteDto): Observable<PartiePrenante> {
    return partiesPrenantesControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return partiesPrenantesControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
