import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { BpmnFlowEntity } from '../api-client/models/bpmn-flow-entity';
import { BpmnViewResultEntity } from '../api-client/models/bpmn-view-result-entity';
import { CreateBpmnElementDto } from '../api-client/models/create-bpmn-element-dto';
import { UpdateBpmnElementDto } from '../api-client/models/update-bpmn-element-dto';
import { CreateBpmnFlowDto } from '../api-client/models/create-bpmn-flow-dto';
import { CreateBpmnProcessusDto } from '../api-client/models/create-bpmn-processus-dto';
import { UpdateBpmnProcessusDto } from '../api-client/models/update-bpmn-processus-dto';
import { ProcessusProgressionEntity } from '../api-client/models/processus-progression-entity';
import { bpmnControllerFindAll } from '../api-client/fn/bpmn-processus/bpmn-controller-find-all';
import { bpmnControllerFindOne } from '../api-client/fn/bpmn-processus/bpmn-controller-find-one';
import { bpmnControllerGenerateVue } from '../api-client/fn/bpmn-processus/bpmn-controller-generate-vue';
import { bpmnControllerGenererDiagramme } from '../api-client/fn/bpmn-processus/bpmn-controller-generer-diagramme';
import { bpmnControllerCreate } from '../api-client/fn/bpmn-processus/bpmn-controller-create';
import { bpmnControllerUpdate } from '../api-client/fn/bpmn-processus/bpmn-controller-update';
import { bpmnControllerRemove } from '../api-client/fn/bpmn-processus/bpmn-controller-remove';
import { bpmnControllerAddElement } from '../api-client/fn/bpmn-processus/bpmn-controller-add-element';
import { bpmnControllerUpdateElement } from '../api-client/fn/bpmn-processus/bpmn-controller-update-element';
import { bpmnControllerRemoveElement } from '../api-client/fn/bpmn-processus/bpmn-controller-remove-element';
import { bpmnControllerAddFlow } from '../api-client/fn/bpmn-processus/bpmn-controller-add-flow';
import { bpmnControllerRemoveFlow } from '../api-client/fn/bpmn-processus/bpmn-controller-remove-flow';

export type TypeBpmn =
  | 'EVENEMENT_DEBUT'
  | 'EVENEMENT_FIN'
  | 'EVENEMENT_INTERMEDIAIRE'
  | 'TACHE'
  | 'SOUS_PROCESSUS'
  | 'PASSERELLE_EXCLUSIVE'
  | 'PASSERELLE_PARALLELE'
  | 'PASSERELLE_INCLUSIVE'
  | 'PASSERELLE_EVENEMENTIELLE';

/** Déclencheur d'un événement — pertinent uniquement pour les 3 types événement. */
export type DeclencheurEvenement = 'MESSAGE' | 'MINUTERIE' | 'ERREUR' | 'SIGNAL' | 'CONDITIONNEL' | 'TERMINAISON' | 'ESCALADE';

/** Nature d'une tâche — pertinent uniquement pour TypeBpmn = TACHE. */
export type TypeTache = 'UTILISATEUR' | 'SERVICE' | 'MANUELLE' | 'ENVOI' | 'RECEPTION' | 'REGLE_METIER' | 'SCRIPT';

export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';
export type TypeProcessus = 'METIER' | 'SUPPORT' | 'PILOTAGE';

export type BpmnFlow = BpmnFlowEntity;
export type BpmnView = BpmnViewResultEntity;

/**
 * `BpmnProcessusEntity`, `BpmnProcessusListItemEntity` (avec `_count`) et
 * `BpmnProcessusDetailEntity` (avec `organisationId`) sont trois formes
 * générées différentes pour la même notion de processus selon l'endpoint.
 * On garde l'interface écrite à la main (compatible structurellement en
 * lecture avec les trois) pour ne pas devoir la faire varier selon la
 * méthode appelée.
 */
export interface BpmnProcessus {
  id: string;
  nom: string;
  description?: string | null;
  /** Étapes en langage naturel, une par ligne : source de la proposition de diagramme. */
  etapes?: string | null;
  type: TypeProcessus;
  bpmnXml?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { elements: number };
  /** Objectifs stratégiques visés par ce processus. */
  objectifs?: Array<{ objectif: { id: string; nom: string; statut: string } }>;
}

/**
 * `BpmnElementEntity` (sans flux) et `BpmnElementWithFlowsEntity` (flux
 * obligatoires) sont utilisés selon l'endpoint. Interface écrite à la main
 * avec flux optionnels, compatible structurellement avec les deux.
 */
export interface BpmnElement {
  id: string;
  nom: string;
  type: TypeBpmn;
  declencheur?: DeclencheurEvenement | null;
  typeTache?: TypeTache | null;
  statut: StatutElement;
  positionX?: number | null;
  positionY?: number | null;
  processusId: string;
  flowsSource?: BpmnFlow[];
  flowsTarget?: BpmnFlow[];
}

export interface BpmnProcessusDetail extends BpmnProcessus {
  elements: BpmnElement[];
}

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class BpmnService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  // ── Processus ──────────────────────────────────────────────────────────────

  list(): Observable<BpmnProcessus[]> {
    return bpmnControllerFindAll(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  get(id: string): Observable<BpmnProcessusDetail> {
    return bpmnControllerFindOne(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  generateView(id: string): Observable<BpmnView> {
    return bpmnControllerGenerateVue(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  /**
   * Génère (côté backend) une proposition de diagramme à partir du champ
   * `etapes` du processus. Échoue si le diagramme contient déjà des éléments.
   */
  generateDiagramme(id: string): Observable<BpmnProcessusDetail> {
    return bpmnControllerGenererDiagramme(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  create(payload: { nom: string; description?: string; type?: TypeProcessus; etapes?: string }): Observable<BpmnProcessus> {
    return bpmnControllerCreate(this.http, this.config.rootUrl, { body: payload as CreateBpmnProcessusDto }).pipe(
      map((r) => r.body),
    );
  }

  update(
    id: string,
    payload: { nom?: string; description?: string; type?: TypeProcessus; etapes?: string },
  ): Observable<BpmnProcessus> {
    return bpmnControllerUpdate(this.http, this.config.rootUrl, { id, body: payload as UpdateBpmnProcessusDto }).pipe(
      map((r) => r.body),
    );
  }

  delete(id: string): Observable<void> {
    return bpmnControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  // ── Éléments ───────────────────────────────────────────────────────────────

  addElement(
    processusId: string,
    payload: { nom: string; type: TypeBpmn; declencheur?: DeclencheurEvenement; typeTache?: TypeTache; statut?: StatutElement },
  ): Observable<BpmnElement> {
    return bpmnControllerAddElement(this.http, this.config.rootUrl, {
      id: processusId,
      body: payload as CreateBpmnElementDto,
    }).pipe(map((r) => r.body));
  }

  updateElement(
    elementId: string,
    payload: {
      nom?: string;
      type?: TypeBpmn;
      declencheur?: DeclencheurEvenement;
      typeTache?: TypeTache;
      statut?: StatutElement;
      positionX?: number;
      positionY?: number;
    },
  ): Observable<BpmnElement> {
    return bpmnControllerUpdateElement(this.http, this.config.rootUrl, {
      elementId,
      body: payload as UpdateBpmnElementDto,
    }).pipe(map((r) => r.body));
  }

  deleteElement(elementId: string): Observable<void> {
    return bpmnControllerRemoveElement(this.http, this.config.rootUrl, { elementId }).pipe(map(() => undefined));
  }

  // ── Flux ───────────────────────────────────────────────────────────────────

  addFlow(processusId: string, payload: { sourceId: string; targetId: string; label?: string }): Observable<BpmnFlow> {
    return bpmnControllerAddFlow(this.http, this.config.rootUrl, {
      id: processusId,
      body: payload as CreateBpmnFlowDto,
    }).pipe(map((r) => r.body));
  }

  deleteFlow(flowId: string): Observable<void> {
    return bpmnControllerRemoveFlow(this.http, this.config.rootUrl, { flowId }).pipe(map(() => undefined));
  }

  // ── Objectifs visés ────────────────────────────────────────────────────────

  /** Met à jour les objectifs stratégiques visés par un processus. */
  updateObjectifs(processusId: string, objectifIds: string[]): Observable<BpmnProcessusDetail> {
    return this.http
      .patch<BpmnProcessusDetail>(
        `${this.config.rootUrl}/api/v1/bpmn-processus/${processusId}/objectifs`,
        { objectifIds },
      );
  }

  /** Calcule la progression d'un processus vers ses objectifs cibles. */
  getProgression(processusId: string): Observable<ProcessusProgressionEntity> {
    return this.http.get<ProcessusProgressionEntity>(
      `${this.config.rootUrl}/api/v1/bpmn-processus/${processusId}/progression`,
    );
  }
}
