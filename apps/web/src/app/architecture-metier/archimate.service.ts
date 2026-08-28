import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

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
  categorieExigence?: CategorieExigence | null;
  capaciteMetierId?: string | null;
  capacite?: { id: string; nom: string } | null;
  positionX?: number | null;
  positionY?: number | null;
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

  /** Utilisé comme source du menu déroulant Capacité dans les formulaires Éléments : a besoin de toutes les capacités. */
  listCapacites(): Observable<CapaciteMetier[]> {
    return this.http.get<CapaciteMetier[]>('/capacites-metier');
  }

  listCapacitesPaginated(page: number, pageSize: number): Observable<Paginated<CapaciteMetier>> {
    return this.http.get<Paginated<CapaciteMetier>>('/capacites-metier', { params: { page, pageSize } });
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

  /** Utilisé comme source des menus déroulants Source/Cible dans le formulaire Relations : a besoin de tous les éléments. */
  listElements(type?: TypeElement): Observable<ElementArchimate[]> {
    return this.http.get<ElementArchimate[]>('/elements-archimate', {
      params: type ? { type } : {},
    });
  }

  listElementsPaginated(page: number, pageSize: number, type?: TypeElement): Observable<Paginated<ElementArchimate>> {
    return this.http.get<Paginated<ElementArchimate>>('/elements-archimate', {
      params: { page, pageSize, ...(type ? { type } : {}) },
    });
  }

  createElement(payload: {
    type: TypeElement;
    nom: string;
    description?: string;
    categorieExigence?: CategorieExigence;
    capaciteMetierId?: string;
    positionX?: number;
    positionY?: number;
  }): Observable<ElementArchimate> {
    return this.http.post<ElementArchimate>('/elements-archimate', payload);
  }

  updateElement(
    id: string,
    payload: {
      nom?: string;
      type?: TypeElement;
      description?: string;
      categorieExigence?: CategorieExigence;
      capaciteMetierId?: string | null;
      positionX?: number;
      positionY?: number;
    },
  ): Observable<ElementArchimate> {
    return this.http.patch<ElementArchimate>(`/elements-archimate/${id}`, payload);
  }

  deleteElement(id: string): Observable<void> {
    return this.http.delete<void>(`/elements-archimate/${id}`);
  }

  generateView(): Observable<ArchimateView> {
    return this.http.get<ArchimateView>('/elements-archimate/generate-vue');
  }

  updateElementPosition(id: string, positionX: number, positionY: number): Observable<ElementArchimate> {
    return this.http.patch<ElementArchimate>(`/elements-archimate/${id}/position`, { positionX, positionY });
  }

  updateElementPositionsBatch(
    items: { id: string; positionX: number; positionY: number }[],
  ): Observable<ElementArchimate[]> {
    return this.http.patch<ElementArchimate[]>('/elements-archimate/positions', { items });
  }

  generateLayout(): Observable<{ elements: ElementArchimate[]; elementCount: number }> {
    return this.http.post<{ elements: ElementArchimate[]; elementCount: number }>(
      '/elements-archimate/generate-layout',
      {},
    );
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────

  /** Utilisé par le canevas interactif : a besoin de toutes les relations pour se dessiner. */
  listRelations(): Observable<RelationArchimate[]> {
    return this.http.get<RelationArchimate[]>('/relations-archimate');
  }

  listRelationsPaginated(page: number, pageSize: number): Observable<Paginated<RelationArchimate>> {
    return this.http.get<Paginated<RelationArchimate>>('/relations-archimate', { params: { page, pageSize } });
  }

  createRelation(payload: { type: TypeRelation; sourceId: string; targetId: string }): Observable<RelationArchimate> {
    return this.http.post<RelationArchimate>('/relations-archimate', payload);
  }

  deleteRelation(id: string): Observable<void> {
    return this.http.delete<void>(`/relations-archimate/${id}`);
  }
}
