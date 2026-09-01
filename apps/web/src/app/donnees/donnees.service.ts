import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { DataEntityEntity } from '../api-client/models/data-entity-entity';
import { DataAttributeEntity } from '../api-client/models/data-attribute-entity';
import { DataRelationEntity } from '../api-client/models/data-relation-entity';
import { DataRelationDetailEntity } from '../api-client/models/data-relation-detail-entity';
import { CreateDataEntityDto } from '../api-client/models/create-data-entity-dto';
import { UpdateDataEntityDto } from '../api-client/models/update-data-entity-dto';
import { CreateDataAttributeDto } from '../api-client/models/create-data-attribute-dto';
import { CreateDataRelationDto } from '../api-client/models/create-data-relation-dto';
import { donneesControllerFindAll } from '../api-client/fn/data-entities/donnees-controller-find-all';
import { donneesControllerCreate } from '../api-client/fn/data-entities/donnees-controller-create';
import { donneesControllerUpdate } from '../api-client/fn/data-entities/donnees-controller-update';
import { donneesControllerRemove } from '../api-client/fn/data-entities/donnees-controller-remove';
import { donneesControllerAddAttribute } from '../api-client/fn/data-entities/donnees-controller-add-attribute';
import { donneesControllerRemoveAttribute } from '../api-client/fn/data-entities/donnees-controller-remove-attribute';
import { donneesControllerFindAllRelations } from '../api-client/fn/data-entities/donnees-controller-find-all-relations';
import { donneesControllerCreateRelation } from '../api-client/fn/data-entities/donnees-controller-create-relation';
import { donneesControllerRemoveRelation } from '../api-client/fn/data-entities/donnees-controller-remove-relation';
import { donneesControllerGenerateLayout } from '../api-client/fn/data-entities/donnees-controller-generate-layout';
import { DiagramLayoutResultEntity } from '../api-client/models/diagram-layout-result-entity';

export type TypeCardinalite = 'UN_A_UN' | 'UN_A_PLUSIEURS' | 'PLUSIEURS_A_PLUSIEURS';
export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

export type DataAttribute = DataAttributeEntity;
export type DataEntity = DataEntityEntity;
export type DiagramLayoutResult = DiagramLayoutResultEntity;
/** Renvoyée par la liste des relations : source/target sont des DataEntityRefEntity (sans les attributs imbriqués). */
export type DataRelation = DataRelationDetailEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class DonneesService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  /** Utilisé par le canevas interactif : a besoin de toutes les entités pour se dessiner. */
  list(): Observable<DataEntity[]> {
    return donneesControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<DataEntity>> {
    return donneesControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<DataEntity>),
    );
  }

  create(payload: CreateDataEntityDto): Observable<DataEntity> {
    return donneesControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  update(id: string, payload: UpdateDataEntityDto): Observable<DataEntity> {
    return donneesControllerUpdate(this.http, this.config.rootUrl, { id, body: payload }).pipe(map((r) => r.body));
  }

  delete(id: string): Observable<void> {
    return donneesControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  addAttribute(entityId: string, payload: CreateDataAttributeDto): Observable<DataAttribute> {
    return donneesControllerAddAttribute(this.http, this.config.rootUrl, { id: entityId, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  removeAttribute(attributeId: string): Observable<void> {
    return donneesControllerRemoveAttribute(this.http, this.config.rootUrl, { attributeId }).pipe(
      map(() => undefined),
    );
  }

  /** Utilisé par le canevas interactif : a besoin de toutes les relations pour se dessiner. */
  listRelations(): Observable<DataRelation[]> {
    return donneesControllerFindAllRelations(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listRelationsPaginated(page: number, pageSize: number): Observable<Paginated<DataRelation>> {
    return donneesControllerFindAllRelations(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<DataRelation>),
    );
  }

  createRelation(payload: CreateDataRelationDto): Observable<DataRelationEntity> {
    return donneesControllerCreateRelation(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  removeRelation(relationId: string): Observable<void> {
    return donneesControllerRemoveRelation(this.http, this.config.rootUrl, { relationId }).pipe(
      map(() => undefined),
    );
  }

  /** Dispose automatiquement les entités et déduit les relations clé étrangère manquantes. */
  generateLayout(): Observable<DiagramLayoutResult> {
    return donneesControllerGenerateLayout(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
