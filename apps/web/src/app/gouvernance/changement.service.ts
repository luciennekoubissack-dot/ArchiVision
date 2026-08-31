import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { DemandeChangementEntity } from '../api-client/models/demande-changement-entity';
import { ChangementStatsEntity } from '../api-client/models/changement-stats-entity';
import { CreateChangementDto } from '../api-client/models/create-changement-dto';
import { changementControllerFindAll } from '../api-client/fn/demandes-changement/changement-controller-find-all';
import { changementControllerGetStats } from '../api-client/fn/demandes-changement/changement-controller-get-stats';
import { changementControllerCreate } from '../api-client/fn/demandes-changement/changement-controller-create';
import { changementControllerUpdate } from '../api-client/fn/demandes-changement/changement-controller-update';
import { changementControllerRemove } from '../api-client/fn/demandes-changement/changement-controller-remove';

export type StatutChangement = 'PROPOSE' | 'APPROUVE' | 'REJETE' | 'IMPLEMENTE';

export type DemandeChangement = DemandeChangementEntity;
export type ChangementStats = ChangementStatsEntity;
export type CreateChangementPayload = CreateChangementDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class ChangementService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Statistiques du rapport (compte total, en cours), sans charger la liste complète. */
  stats(): Observable<ChangementStats> {
    return changementControllerGetStats(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<DemandeChangement>> {
    return changementControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<DemandeChangement>),
    );
  }

  create(payload: CreateChangementPayload): Observable<DemandeChangement> {
    return changementControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: Partial<CreateChangementPayload>): Observable<DemandeChangement> {
    return changementControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return changementControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
