import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeBpmn =
  | 'EVENEMENT_DEBUT'
  | 'EVENEMENT_FIN'
  | 'EVENEMENT_INTERMEDIAIRE'
  | 'TACHE'
  | 'PASSERELLE_EXCLUSIVE'
  | 'PASSERELLE_PARALLELE';

export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

export interface BpmnProcessus {
  id: string;
  nom: string;
  description?: string | null;
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

@Injectable({ providedIn: 'root' })
export class BpmnService {
  constructor(private http: HttpClient) {}

  list(): Observable<BpmnProcessus[]> {
    return this.http.get<BpmnProcessus[]>('/bpmn-processus');
  }

  get(id: string): Observable<BpmnProcessusDetail> {
    return this.http.get<BpmnProcessusDetail>(`/bpmn-processus/${id}`);
  }

  create(payload: { nom: string; description?: string }): Observable<BpmnProcessus> {
    return this.http.post<BpmnProcessus>('/bpmn-processus', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/bpmn-processus/${id}`);
  }

  addElement(processusId: string, payload: { nom: string; type: TypeBpmn }): Observable<BpmnElement> {
    return this.http.post<BpmnElement>(`/bpmn-processus/${processusId}/elements`, payload);
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
