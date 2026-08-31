import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { CanevasRelationEntity } from '../api-client/models/canevas-relation-entity';
import { CreateCanevasRelationDto } from '../api-client/models/create-canevas-relation-dto';
import { canevasControllerFindAll } from '../api-client/fn/canevas-relations/canevas-controller-find-all';
import { canevasControllerCreate } from '../api-client/fn/canevas-relations/canevas-controller-create';
import { canevasControllerRemove } from '../api-client/fn/canevas-relations/canevas-controller-remove';

export type ElementKind = 'ARCHIMATE' | 'APPLICATION' | 'TECH_COMPONENT' | 'DATA_ENTITY';

export type CanevasRelation = CanevasRelationEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class CanevasService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  listRelations(): Observable<CanevasRelation[]> {
    return canevasControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  createRelation(payload: CreateCanevasRelationDto): Observable<CanevasRelation> {
    return canevasControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  deleteRelation(id: string): Observable<void> {
    return canevasControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
