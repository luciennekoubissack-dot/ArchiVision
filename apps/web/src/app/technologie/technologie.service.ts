import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { TechComponentEntity } from '../api-client/models/tech-component-entity';
import { TechDeploiementEntity } from '../api-client/models/tech-deploiement-entity';
import { TechDeploiementDetailEntity } from '../api-client/models/tech-deploiement-detail-entity';
import { CreateTechComponentDto } from '../api-client/models/create-tech-component-dto';
import { UpdateTechComponentDto } from '../api-client/models/update-tech-component-dto';
import { DeployerApplicationDto } from '../api-client/models/deployer-application-dto';
import { technologieControllerFindAll } from '../api-client/fn/tech-components/technologie-controller-find-all';
import { technologieControllerCreate } from '../api-client/fn/tech-components/technologie-controller-create';
import { technologieControllerUpdate } from '../api-client/fn/tech-components/technologie-controller-update';
import { technologieControllerRemove } from '../api-client/fn/tech-components/technologie-controller-remove';
import { technologieControllerDeployer } from '../api-client/fn/tech-components/technologie-controller-deployer';
import { technologieControllerUndeployer } from '../api-client/fn/tech-components/technologie-controller-undeployer';
import { technologieControllerGenerateLayout } from '../api-client/fn/tech-components/technologie-controller-generate-layout';
import { DiagramLayoutResultEntity } from '../api-client/models/diagram-layout-result-entity';

export type TypeTechComponent =
  | 'SERVEUR' | 'RESEAU' | 'CLOUD' | 'BASE_DE_DONNEES' | 'MIDDLEWARE'
  | 'ORDINATEUR_PORTABLE' | 'ROUTEUR_RESEAU' | 'CAPTEUR_IOT_CONSOMMATION' | 'SMARTPHONE_PROFESSIONNEL' | 'STOCKAGE_NAS'
  | 'BASE_DE_DONNEES_POSTGRESQL' | 'SERVEUR_APPLICATIONS' | 'API_REST' | 'LOGICIEL_CYBERSECURITE' | 'SYSTEME_EXPLOITATION_LINUX' | 'PLATEFORME_CLOUD'
  | 'PARE_FEU' | 'SWITCH' | 'VPN' | 'CONNEXION_INTERNET_FIBRE' | 'AUTRE';
export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

/** Forme imbriquée dans TechComponent.deploiements : inclut l'application déployée. */
export type TechDeploiement = TechDeploiementDetailEntity;
export type TechComponent = TechComponentEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class TechnologieService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé par le canevas interactif : a besoin de tous les composants pour se dessiner. */
  list(): Observable<TechComponent[]> {
    return technologieControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<TechComponent>> {
    return technologieControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<TechComponent>),
    );
  }

  create(payload: CreateTechComponentDto): Observable<TechComponent> {
    return technologieControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateTechComponentDto): Observable<TechComponent> {
    return technologieControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return technologieControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  /**
   * Le back-end crée le déploiement sans y inclure l'application liée (contrairement à la liste
   * imbriquée dans TechComponent.deploiements) : le type de retour reflète donc TechDeploiementEntity
   * (sans `application`) et non l'alias TechDeploiement ci-dessus. Aucun appelant n'exploite la valeur
   * renvoyée (voir technologie.component.ts), donc ce resserrement de type est sans risque.
   */
  deployer(payload: DeployerApplicationDto): Observable<TechDeploiementEntity> {
    return technologieControllerDeployer(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  undeployer(techComponentId: string, applicationId: string): Observable<void> {
    return technologieControllerUndeployer(this.http, this.config.rootUrl, { techComponentId, applicationId }).pipe(
      map(() => undefined),
    );
  }

  /** Dispose automatiquement les composants du diagramme de déploiement en grille. */
  generateLayout(): Observable<DiagramLayoutResultEntity> {
    return technologieControllerGenerateLayout(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
