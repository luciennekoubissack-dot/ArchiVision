import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface BpmnProcessus {
  id: string;
  nom: string;
  description?: string | null;
  type: TypeProcessus;
  bpmnXml?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { elements: number };
}

export interface BpmnFlow {
  id: string;
  label?: string | null;
  sourceId: string;
  targetId: string;
}

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

export interface BpmnView {
  svg: string;
  elementCount: number;
  flowCount: number;
}

@Injectable({ providedIn: 'root' })
export class BpmnService {
  constructor(private http: HttpClient) {}

  list(): Observable<BpmnProcessus[]> {
    return this.http.get<BpmnProcessus[]>('/bpmn-processus');
  }

  get(id: string): Observable<BpmnProcessusDetail> {
    return this.http.get<BpmnProcessusDetail>(`/bpmn-processus/${id}`);
  }

  generateView(id: string): Observable<BpmnView> {
    return this.http.get<BpmnView>(`/bpmn-processus/${id}/generate-vue`);
  }

  create(payload: { nom: string; description?: string; type?: TypeProcessus }): Observable<BpmnProcessus> {
    return this.http.post<BpmnProcessus>('/bpmn-processus', payload);
  }

  update(id: string, payload: { nom?: string; description?: string; type?: TypeProcessus }): Observable<BpmnProcessus> {
    return this.http.patch<BpmnProcessus>(`/bpmn-processus/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/bpmn-processus/${id}`);
  }

  addElement(
    processusId: string,
    payload: { nom: string; type: TypeBpmn; declencheur?: DeclencheurEvenement; typeTache?: TypeTache; statut?: StatutElement },
  ): Observable<BpmnElement> {
    return this.http.post<BpmnElement>(`/bpmn-processus/${processusId}/elements`, payload);
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
    return this.http.patch<BpmnElement>(`/bpmn-processus/elements/${elementId}`, payload);
  }

  deleteElement(elementId: string): Observable<void> {
    return this.http.delete<void>(`/bpmn-processus/elements/${elementId}`);
  }

  addFlow(
    processusId: string,
    payload: { sourceId: string; targetId: string; label?: string },
  ): Observable<BpmnFlow> {
    return this.http.post<BpmnFlow>(`/bpmn-processus/${processusId}/flows`, payload);
  }

  deleteFlow(flowId: string): Observable<void> {
    return this.http.delete<void>(`/bpmn-processus/flows/${flowId}`);
  }
}
