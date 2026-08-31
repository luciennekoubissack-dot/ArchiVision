import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { CapaciteMetierEntity } from '../api-client/models/capacite-metier-entity';
import { ElementArchimateEntity } from '../api-client/models/element-archimate-entity';
import { RelationArchimateEntity } from '../api-client/models/relation-archimate-entity';
import { ArchimateViewEntity } from '../api-client/models/archimate-view-entity';
import { ArchimateLayoutEntity } from '../api-client/models/archimate-layout-entity';
import { CreateCapaciteDto } from '../api-client/models/create-capacite-dto';
import { UpdateCapaciteDto } from '../api-client/models/update-capacite-dto';
import { CreateElementDto } from '../api-client/models/create-element-dto';
import { UpdateElementDto } from '../api-client/models/update-element-dto';
import { CreateRelationDto } from '../api-client/models/create-relation-dto';
import { PositionItemDto } from '../api-client/models/position-item-dto';
import { archimateControllerFindAllCapacites } from '../api-client/fn/archimate/archimate-controller-find-all-capacites';
import { archimateControllerCreateCapacite } from '../api-client/fn/archimate/archimate-controller-create-capacite';
import { archimateControllerUpdateCapacite } from '../api-client/fn/archimate/archimate-controller-update-capacite';
import { archimateControllerRemoveCapacite } from '../api-client/fn/archimate/archimate-controller-remove-capacite';
import { archimateControllerFindAllElements } from '../api-client/fn/archimate/archimate-controller-find-all-elements';
import { archimateControllerCreateElement } from '../api-client/fn/archimate/archimate-controller-create-element';
import { archimateControllerUpdateElement } from '../api-client/fn/archimate/archimate-controller-update-element';
import { archimateControllerRemoveElement } from '../api-client/fn/archimate/archimate-controller-remove-element';
import { archimateControllerGenerateVue } from '../api-client/fn/archimate/archimate-controller-generate-vue';
import { archimateControllerUpdatePosition } from '../api-client/fn/archimate/archimate-controller-update-position';
import { archimateControllerUpdatePositionsBatch } from '../api-client/fn/archimate/archimate-controller-update-positions-batch';
import { archimateControllerGenerateLayout } from '../api-client/fn/archimate/archimate-controller-generate-layout';
import { archimateControllerFindAllRelations } from '../api-client/fn/archimate/archimate-controller-find-all-relations';
import { archimateControllerCreateRelation } from '../api-client/fn/archimate/archimate-controller-create-relation';
import { archimateControllerRemoveRelation } from '../api-client/fn/archimate/archimate-controller-remove-relation';

export type TypeElement =
  | 'VISION'
  | 'OBJECTIF_ARCHIMATE'
  | 'PRINCIPE'
  | 'EXIGENCE'
  | 'ACTEUR_METIER'
  | 'ROLE_METIER'
  | 'PROCESSUS_METIER'
  | 'SERVICE_METIER'
  | 'OBJET_METIER';

export type TypeRelation = 'ASSIGNATION' | 'COMPOSITION' | 'REALISATION' | 'ASSOCIATION';

export type CategorieExigence = 'FONCTIONNELLE' | 'NON_FONCTIONNELLE';

export type CapaciteMetier = CapaciteMetierEntity;
export type ElementArchimate = ElementArchimateEntity;
export type RelationArchimate = RelationArchimateEntity;
export type ArchimateView = ArchimateViewEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class ArchimateService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  // ── Capacités métier ──────────────────────────────────────────────────────

  /** Utilisé comme source du menu déroulant Capacité dans les formulaires Éléments : a besoin de toutes les capacités. */
  listCapacites(): Observable<CapaciteMetier[]> {
    return archimateControllerFindAllCapacites(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listCapacitesPaginated(page: number, pageSize: number): Observable<Paginated<CapaciteMetier>> {
    return archimateControllerFindAllCapacites(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<CapaciteMetier>),
    );
  }

  createCapacite(payload: CreateCapaciteDto): Observable<CapaciteMetier> {
    return archimateControllerCreateCapacite(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  updateCapacite(id: string, payload: UpdateCapaciteDto): Observable<CapaciteMetier> {
    return archimateControllerUpdateCapacite(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteCapacite(id: string): Observable<void> {
    return archimateControllerRemoveCapacite(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────

  /** Utilisé comme source des menus déroulants Source/Cible dans le formulaire Relations : a besoin de tous les éléments. */
  listElements(type?: TypeElement): Observable<ElementArchimate[]> {
    return archimateControllerFindAllElements(this.http, this.config.rootUrl, { type }).pipe(map((r) => r.body));
  }

  listElementsPaginated(page: number, pageSize: number, type?: TypeElement): Observable<Paginated<ElementArchimate>> {
    return archimateControllerFindAllElements(this.http, this.config.rootUrl, { page, pageSize, type }).pipe(
      map((r) => r.body as unknown as Paginated<ElementArchimate>),
    );
  }

  createElement(payload: CreateElementDto): Observable<ElementArchimate> {
    return archimateControllerCreateElement(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  updateElement(id: string, payload: UpdateElementDto): Observable<ElementArchimate> {
    return archimateControllerUpdateElement(this.http, this.config.rootUrl, { id, body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteElement(id: string): Observable<void> {
    return archimateControllerRemoveElement(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  generateView(): Observable<ArchimateView> {
    return archimateControllerGenerateVue(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  updateElementPosition(id: string, positionX: number, positionY: number): Observable<ElementArchimate> {
    return archimateControllerUpdatePosition(this.http, this.config.rootUrl, {
      id,
      body: { positionX, positionY },
    }).pipe(map((r) => r.body));
  }

  updateElementPositionsBatch(items: PositionItemDto[]): Observable<ElementArchimate[]> {
    return archimateControllerUpdatePositionsBatch(this.http, this.config.rootUrl, { body: { items } }).pipe(
      map((r) => r.body),
    );
  }

  generateLayout(): Observable<ArchimateLayoutEntity> {
    return archimateControllerGenerateLayout(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────

  /** Utilisé par le canevas interactif : a besoin de toutes les relations pour se dessiner. */
  listRelations(): Observable<RelationArchimate[]> {
    return archimateControllerFindAllRelations(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  listRelationsPaginated(page: number, pageSize: number): Observable<Paginated<RelationArchimate>> {
    return archimateControllerFindAllRelations(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<RelationArchimate>),
    );
  }

  createRelation(payload: CreateRelationDto): Observable<RelationArchimate> {
    return archimateControllerCreateRelation(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  deleteRelation(id: string): Observable<void> {
    return archimateControllerRemoveRelation(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
