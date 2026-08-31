import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ProjetEntity } from '../api-client/models/projet-entity';
import { CreateProjetDto } from '../api-client/models/create-projet-dto';
import { UpdateProjetDto } from '../api-client/models/update-projet-dto';
import { roadmapControllerFindAll } from '../api-client/fn/projets/roadmap-controller-find-all';
import { roadmapControllerCreate } from '../api-client/fn/projets/roadmap-controller-create';
import { roadmapControllerUpdate } from '../api-client/fn/projets/roadmap-controller-update';
import { roadmapControllerRemove } from '../api-client/fn/projets/roadmap-controller-remove';

export type PrioriteProjet = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type StatutProjet = 'PLANIFIE' | 'EN_COURS' | 'TERMINE';

export type Projet = ProjetEntity;
export type CreateProjetPayload = CreateProjetDto;
export type UpdateProjetPayload = UpdateProjetDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class RoadmapService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé par la frise chronologique : a besoin de tous les projets pour calculer la plage de dates. */
  list(): Observable<Projet[]> {
    return roadmapControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Projet>> {
    return roadmapControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Projet>),
    );
  }

  create(payload: CreateProjetPayload): Observable<Projet> {
    return roadmapControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateProjetPayload): Observable<Projet> {
    return roadmapControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return roadmapControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
