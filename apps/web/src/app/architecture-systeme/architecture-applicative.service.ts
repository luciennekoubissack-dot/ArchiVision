import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { ArchiApplicativeElementEntity } from '../api-client/models/archi-applicative-element-entity';
import { ArchiApplicativeFluxEntity } from '../api-client/models/archi-applicative-flux-entity';
import { ArchitectureApplicativeVueEntity } from '../api-client/models/architecture-applicative-vue-entity';
import { CreateArchiApplicativeElementDto } from '../api-client/models/create-archi-applicative-element-dto';
import { UpdateArchiApplicativeElementDto } from '../api-client/models/update-archi-applicative-element-dto';
import { CreateArchiApplicativeFluxDto } from '../api-client/models/create-archi-applicative-flux-dto';
import { architectureApplicativeControllerFindAllElements } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-find-all-elements';
import { architectureApplicativeControllerCreateElement } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-create-element';
import { architectureApplicativeControllerUpdateElement } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-update-element';
import { architectureApplicativeControllerRemoveElement } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-remove-element';
import { architectureApplicativeControllerFindAllFlux } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-find-all-flux';
import { architectureApplicativeControllerCreateFlux } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-create-flux';
import { architectureApplicativeControllerRemoveFlux } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-remove-flux';
import { architectureApplicativeControllerGenerateVue } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-generate-vue';
import { architectureApplicativeControllerGenerateLayout } from '../api-client/fn/architecture-applicative/architecture-applicative-controller-generate-layout';
import { DiagramLayoutResultEntity } from '../api-client/models/diagram-layout-result-entity';

export type TypeElementArchiApplicative =
  | 'UTILISATEUR_INTERNE'
  | 'UTILISATEUR_EXTERNE'
  | 'APPLICATION'
  | 'BASE_DE_DONNEES'
  | 'SYSTEME_EXTERNE'
  | 'INFRASTRUCTURE'
  | 'SECURITE';

export type TypeFluxArchiApplicative = 'API' | 'DONNEES' | 'AUTHENTIFICATION' | 'RESEAU';

export type ArchiApplicativeElement = ArchiApplicativeElementEntity;
export type ArchiApplicativeFlux = ArchiApplicativeFluxEntity;
export type ArchiApplicativeView = ArchitectureApplicativeVueEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 *
 * Note : `listFlux` renvoie via l'API générée des flux enrichis de leurs
 * éléments source/cible complets (`ArchiApplicativeFluxWithElementsEntity`),
 * un sur-ensemble structurel de `ArchiApplicativeFlux` ; l'affectation reste
 * donc valide sans cast.
 */
@Injectable({ providedIn: 'root' })
export class ArchitectureApplicativeService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  listElements(): Observable<ArchiApplicativeElement[]> {
    return architectureApplicativeControllerFindAllElements(this.http, this.config.rootUrl).pipe(
      map((r) => r.body),
    );
  }

  createElement(payload: CreateArchiApplicativeElementDto): Observable<ArchiApplicativeElement> {
    return architectureApplicativeControllerCreateElement(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  updateElement(id: string, payload: UpdateArchiApplicativeElementDto): Observable<ArchiApplicativeElement> {
    return architectureApplicativeControllerUpdateElement(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteElement(id: string): Observable<void> {
    return architectureApplicativeControllerRemoveElement(this.http, this.config.rootUrl, { id }).pipe(
      map(() => undefined),
    );
  }

  listFlux(): Observable<ArchiApplicativeFlux[]> {
    return architectureApplicativeControllerFindAllFlux(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  createFlux(payload: CreateArchiApplicativeFluxDto): Observable<ArchiApplicativeFlux> {
    return architectureApplicativeControllerCreateFlux(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteFlux(id: string): Observable<void> {
    return architectureApplicativeControllerRemoveFlux(this.http, this.config.rootUrl, { id }).pipe(
      map(() => undefined),
    );
  }

  generateView(): Observable<ArchiApplicativeView> {
    return architectureApplicativeControllerGenerateVue(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  /** Dispose automatiquement les éléments en couloirs par type. */
  generateLayout(): Observable<DiagramLayoutResultEntity> {
    return architectureApplicativeControllerGenerateLayout(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
