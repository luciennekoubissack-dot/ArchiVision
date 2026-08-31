import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ApplicationEntity } from '../api-client/models/application-entity';
import { EchangeEntity } from '../api-client/models/echange-entity';
import { ZoneUrbanisationEntity } from '../api-client/models/zone-urbanisation-entity';
import { ApplicationServiceEntity } from '../api-client/models/application-service-entity';
import { ComponentsVueEntity } from '../api-client/models/components-vue-entity';
import { UrbanisationVueEntity } from '../api-client/models/urbanisation-vue-entity';
import { CreateApplicationDto } from '../api-client/models/create-application-dto';
import { UpdateApplicationDto } from '../api-client/models/update-application-dto';
import { CreateZoneDto } from '../api-client/models/create-zone-dto';
import { UpdateZoneDto } from '../api-client/models/update-zone-dto';
import { CreateApplicationServiceDto } from '../api-client/models/create-application-service-dto';
import { CreateEchangeDto } from '../api-client/models/create-echange-dto';
import {
  urbanisationControllerFindAllApplications,
} from '../api-client/fn/urbanisation/urbanisation-controller-find-all-applications';
import {
  urbanisationControllerFindOneApplication,
} from '../api-client/fn/urbanisation/urbanisation-controller-find-one-application';
import {
  urbanisationControllerCreateApplication,
} from '../api-client/fn/urbanisation/urbanisation-controller-create-application';
import {
  urbanisationControllerUpdateApplication,
} from '../api-client/fn/urbanisation/urbanisation-controller-update-application';
import {
  urbanisationControllerRemoveApplication,
} from '../api-client/fn/urbanisation/urbanisation-controller-remove-application';
import {
  urbanisationControllerGenerateComponentsVue,
} from '../api-client/fn/urbanisation/urbanisation-controller-generate-components-vue';
import {
  urbanisationControllerFindAllZones,
  UrbanisationControllerFindAllZones$Params,
} from '../api-client/fn/urbanisation/urbanisation-controller-find-all-zones';
import { urbanisationControllerCreateZone } from '../api-client/fn/urbanisation/urbanisation-controller-create-zone';
import { urbanisationControllerUpdateZone } from '../api-client/fn/urbanisation/urbanisation-controller-update-zone';
import { urbanisationControllerRemoveZone } from '../api-client/fn/urbanisation/urbanisation-controller-remove-zone';
import { urbanisationControllerAffecter } from '../api-client/fn/urbanisation/urbanisation-controller-affecter';
import { urbanisationControllerDesaffecter } from '../api-client/fn/urbanisation/urbanisation-controller-desaffecter';
import { urbanisationControllerGenerateVue } from '../api-client/fn/urbanisation/urbanisation-controller-generate-vue';
import { urbanisationControllerAddService } from '../api-client/fn/urbanisation/urbanisation-controller-add-service';
import {
  urbanisationControllerRemoveService,
} from '../api-client/fn/urbanisation/urbanisation-controller-remove-service';
import {
  urbanisationControllerFindAllEchanges,
} from '../api-client/fn/urbanisation/urbanisation-controller-find-all-echanges';
import { urbanisationControllerCreateEchange } from '../api-client/fn/urbanisation/urbanisation-controller-create-echange';
import { urbanisationControllerRemoveEchange } from '../api-client/fn/urbanisation/urbanisation-controller-remove-echange';

export type TypeZone = 'ZONE' | 'QUARTIER' | 'ILOT';

export type Application = ApplicationEntity;

export type ApplicationServiceItem = ApplicationServiceEntity;

/**
 * Depuis la correction du 2026-08-31 (l'`include` manquant sur la création
 * d'un échange côté backend), `createEchange` renvoie aussi `source`/`target`
 * comme `listEchanges` : simple alias, plus besoin de caster.
 */
export type ApplicationEchange = EchangeEntity;

/** Échange vu depuis une seule application (fiche détail) : ne référence que l'application à l'autre bout du lien. */
export interface ApplicationEchangeLink {
  id: string;
  description?: string | null;
  protocole?: string | null;
  source?: { id: string; nom: string };
  target?: { id: string; nom: string };
}

export type ZoneUrbanisation = ZoneUrbanisationEntity;

export type UrbanisationView = UrbanisationVueEntity;

export type ComponentsView = ComponentsVueEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class UrbanisationService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  // ── Applications ──────────────────────────────────────────────────────────

  /** Utilisé par le canevas interactif et le formulaire d'affectation (Zones) : a besoin de toutes les applications. */
  listApplications(): Observable<Application[]> {
    return urbanisationControllerFindAllApplications(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listApplicationsPaginated(page: number, pageSize: number): Observable<Paginated<Application>> {
    return urbanisationControllerFindAllApplications(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Application>),
    );
  }

  getApplication(id: string): Observable<Application> {
    return urbanisationControllerFindOneApplication(this.http, this.config.rootUrl, { id }).pipe(
      map((r) => r.body),
    );
  }

  createApplication(payload: CreateApplicationDto): Observable<Application> {
    return urbanisationControllerCreateApplication(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  updateApplication(id: string, payload: UpdateApplicationDto): Observable<Application> {
    return urbanisationControllerUpdateApplication(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteApplication(id: string): Observable<void> {
    return urbanisationControllerRemoveApplication(this.http, this.config.rootUrl, { id }).pipe(
      map(() => undefined),
    );
  }

  generateComponentsView(): Observable<ComponentsView> {
    return urbanisationControllerGenerateComponentsVue(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────

  listZones(type?: TypeZone): Observable<ZoneUrbanisation[]> {
    // Le contrat généré déclare `type` requis sur ce endpoint alors que le
    // backend le traite comme optionnel (@Query('type') type?: TypeZone) :
    // simplification connue de la génération, on caste le paramètre.
    const params = (type ? { type } : {}) as UrbanisationControllerFindAllZones$Params;
    return urbanisationControllerFindAllZones(this.http, this.config.rootUrl, params).pipe(map((r) => r.body));
  }

  createZone(payload: CreateZoneDto): Observable<ZoneUrbanisation> {
    return urbanisationControllerCreateZone(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  updateZone(id: string, payload: UpdateZoneDto): Observable<ZoneUrbanisation> {
    return urbanisationControllerUpdateZone(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteZone(id: string): Observable<void> {
    return urbanisationControllerRemoveZone(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  // ── Affectations POS ──────────────────────────────────────────────────────

  affecter(applicationId: string, zoneId: string): Observable<unknown> {
    return urbanisationControllerAffecter(this.http, this.config.rootUrl, {
      body: { applicationId, zoneId },
    }).pipe(map((r) => r.body));
  }

  desaffecter(zoneId: string, applicationId: string): Observable<void> {
    return urbanisationControllerDesaffecter(this.http, this.config.rootUrl, { zoneId, applicationId }).pipe(
      map(() => undefined),
    );
  }

  generateView(): Observable<UrbanisationView> {
    return urbanisationControllerGenerateVue(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  // ── Services applicatifs ────────────────────────────────────────────────────

  addService(applicationId: string, payload: CreateApplicationServiceDto): Observable<ApplicationServiceItem> {
    return urbanisationControllerAddService(this.http, this.config.rootUrl, {
      id: applicationId,
      body: payload,
    }).pipe(map((r) => r.body));
  }

  removeService(serviceId: string): Observable<void> {
    return urbanisationControllerRemoveService(this.http, this.config.rootUrl, { serviceId }).pipe(
      map(() => undefined),
    );
  }

  // ── Échanges applicatifs (diagramme de composants UML) ─────────────────────

  listEchanges(): Observable<ApplicationEchange[]> {
    return urbanisationControllerFindAllEchanges(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  createEchange(payload: CreateEchangeDto): Observable<ApplicationEchange> {
    return urbanisationControllerCreateEchange(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteEchange(id: string): Observable<void> {
    return urbanisationControllerRemoveEchange(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
