import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ConformiteEntity } from '../api-client/models/conformite-entity';
import { ConformiteBySolutionEntity } from '../api-client/models/conformite-by-solution-entity';
import { ConformiteItemDto } from '../api-client/models/conformite-item-dto';
import { conformiteControllerFindAll } from '../api-client/fn/conformites-solutions/conformite-controller-find-all';
import { conformiteControllerUpdate } from '../api-client/fn/conformites-solutions/conformite-controller-update';

export type StatutConformite = 'CONFORME' | 'NON_CONFORME' | 'A_EVALUER';

export type ConformiteSolution = ConformiteBySolutionEntity;
export type ConformiteItem = ConformiteItemDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class ConformiteService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  listAll(): Observable<ConformiteEntity[]> {
    return conformiteControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  updateConformites(solutionId: string, items: ConformiteItem[]): Observable<ConformiteSolution[]> {
    return conformiteControllerUpdate(this.http, this.config.rootUrl, { solutionId, body: { items } }).pipe(
      map((r) => r.body),
    );
  }
}
