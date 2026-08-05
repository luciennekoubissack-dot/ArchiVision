import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeElement =
  | 'ACTEUR_METIER'
  | 'ROLE_METIER'
  | 'PROCESSUS_METIER'
  | 'SERVICE_METIER'
  | 'OBJET_METIER';

export type TypeRelation = 'ASSIGNATION' | 'COMPOSITION' | 'REALISATION' | 'ASSOCIATION';

export interface CapaciteMetier {
  id: string;
  nom: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { elements: number };
}

export interface ElementArchimate {
  id: string;
  nom: string;
  type: TypeElement;
  description?: string | null;
  capaciteMetierId?: string | null;
  capacite?: { id: string; nom: string } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { relationsSource: number; relationsTarget: number };
}

export interface RelationArchimate {
  id: string;
  type: TypeRelation;
  source: { id: string; nom: string; type: TypeElement };
  target: { id: string; nom: string; type: TypeElement };
  createdAt: string;
}

export interface ArchimateView {
  svg: string;
  elementCount: number;
  relationCount: number;
}

@Injectable({ providedIn: 'root' })
export class ArchimateService {
  constructor(private http: HttpClient) {}

  // ── Capacités métier ──────────────────────────────────────────────────────

  listCapacites(): Observable<CapaciteMetier[]> {
    return this.http.get<CapaciteMetier[]>('/capacites-metier');
  }

  createCapacite(payload: { nom: string; description?: string }): Observable<CapaciteMetier> {
    return this.http.post<CapaciteMetier>('/capacites-metier', payload);
  }

  updateCapacite(id: string, payload: { nom?: string; description?: string }): Observable<CapaciteMetier> {
    return this.http.patch<CapaciteMetier>(`/capacites-metier/${id}`, payload);
  }

  deleteCapacite(id: string): Observable<void> {
    return this.http.delete<void>(`/capacites-metier/${id}`);
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────

  listElements(type?: TypeElement): Observable<ElementArchimate[]> {
    return this.http.get<ElementArchimate[]>('/elements-archimate', {
      params: type ? { type } : {},
    });
  }

  createElement(payload: {
    type: TypeElement;
    nom: string;
    description?: string;
    capaciteMetierId?: string;
  }): Observable<ElementArchimate> {
    return this.http.post<ElementArchimate>('/elements-archimate', payload);
  }

  updateElement(
    id: string,
    payload: { nom?: string; type?: TypeElement; description?: string; capaciteMetierId?: string | null },
  ): Observable<ElementArchimate> {
    return this.http.patch<ElementArchimate>(`/elements-archimate/${id}`, payload);
  }

  deleteElement(id: string): Observable<void> {
    return this.http.delete<void>(`/elements-archimate/${id}`);
  }

  generateView(): Observable<ArchimateView> {
    return this.http.get<ArchimateView>('/elements-archimate/generate-vue');
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────

  listRelations(): Observable<RelationArchimate[]> {
    return this.http.get<RelationArchimate[]>('/relations-archimate');
  }

  createRelation(payload: { type: TypeRelation; sourceId: string; targetId: string }): Observable<RelationArchimate> {
    return this.http.post<RelationArchimate>('/relations-archimate', payload);
  }

  deleteRelation(id: string): Observable<void> {
    return this.http.delete<void>(`/relations-archimate/${id}`);
  }
}
