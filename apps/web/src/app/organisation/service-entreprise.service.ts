import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ServiceEntity } from '../api-client/models/service-entity';
import { ServiceViewEntity } from '../api-client/models/service-view-entity';
import { CreateServiceDto } from '../api-client/models/create-service-dto';
import { UpdateServiceDto } from '../api-client/models/update-service-dto';
import { serviceControllerFindAll } from '../api-client/fn/services/service-controller-find-all';
import { serviceControllerCreate } from '../api-client/fn/services/service-controller-create';
import { serviceControllerUpdate } from '../api-client/fn/services/service-controller-update';
import { serviceControllerRemove } from '../api-client/fn/services/service-controller-remove';
import { serviceControllerGenerateVue } from '../api-client/fn/services/service-controller-generate-vue';

export type ServiceEntreprise = ServiceEntity;
export type CreateServiceEntreprisePayload = CreateServiceDto;
export type UpdateServiceEntreprisePayload = UpdateServiceDto;
export type OrganigrammeView = ServiceViewEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class ServiceEntrepriseService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  list(): Observable<ServiceEntreprise[]> {
    return serviceControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  create(payload: CreateServiceEntreprisePayload): Observable<ServiceEntreprise> {
    return serviceControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateServiceEntreprisePayload): Observable<ServiceEntreprise> {
    return serviceControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return serviceControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  generateView(): Observable<OrganigrammeView> {
    return serviceControllerGenerateVue(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
