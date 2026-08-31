import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { EnqueteReponseEntity } from '../api-client/models/enquete-reponse-entity';
import { EnqueteReponseItemDto } from '../api-client/models/enquete-reponse-item-dto';
import { enqueteReponseControllerFindAll } from '../api-client/fn/enquete-reponses/enquete-reponse-controller-find-all';
import { enqueteReponseControllerImport } from '../api-client/fn/enquete-reponses/enquete-reponse-controller-import';
import { enqueteReponseControllerRemove } from '../api-client/fn/enquete-reponses/enquete-reponse-controller-remove';

export type EnqueteReponse = EnqueteReponseEntity;
export type EnqueteReponseItem = EnqueteReponseItemDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class EnqueteReponseService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé pour le rapport (note moyenne, graphique, commentaires) : a besoin de toutes les réponses. */
  list(): Observable<EnqueteReponse[]> {
    return enqueteReponseControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<EnqueteReponse>> {
    return enqueteReponseControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<EnqueteReponse>),
    );
  }

  import(items: EnqueteReponseItem[]): Observable<EnqueteReponse[]> {
    return enqueteReponseControllerImport(this.http, this.config.rootUrl, { body: { items } }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return enqueteReponseControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
