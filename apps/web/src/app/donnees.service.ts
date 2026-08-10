import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeCardinalite = 'UN_A_UN' | 'UN_A_PLUSIEURS' | 'PLUSIEURS_A_PLUSIEURS';
export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

export interface DataAttribute {
  id: string;
  nom: string;
  type: string;
  entityId: string;
}

export interface DataEntity {
  id: string;
  nom: string;
  description?: string | null;
  statut: StatutElement;
  positionX?: number | null;
  positionY?: number | null;
  attributs: DataAttribute[];
  _count?: { attributs: number };
}

export interface DataRelation {
  id: string;
  cardinalite: TypeCardinalite;
  label?: string | null;
  sourceId: string;
  targetId: string;
  source: DataEntity;
  target: DataEntity;
}

@Injectable({ providedIn: 'root' })
export class DonneesService {
  constructor(private http: HttpClient) {}

  list(): Observable<DataEntity[]> {
    return this.http.get<DataEntity[]>('/data-entities');
  }

  create(payload: { nom: string; description?: string; positionX?: number; positionY?: number }): Observable<DataEntity> {
    return this.http.post<DataEntity>('/data-entities', payload);
  }

  update(
    id: string,
    payload: { nom?: string; description?: string; positionX?: number; positionY?: number },
  ): Observable<DataEntity> {
    return this.http.patch<DataEntity>(`/data-entities/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/data-entities/${id}`);
  }

  addAttribute(entityId: string, payload: { nom: string; type: string }): Observable<DataAttribute> {
    return this.http.post<DataAttribute>(`/data-entities/${entityId}/attributs`, payload);
  }

  removeAttribute(attributeId: string): Observable<void> {
    return this.http.delete<void>(`/data-entities/attributs/${attributeId}`);
  }

  listRelations(): Observable<DataRelation[]> {
    return this.http.get<DataRelation[]>('/data-entities/relations');
  }

  createRelation(payload: {
    sourceId: string;
    targetId: string;
    cardinalite: TypeCardinalite;
    label?: string;
  }): Observable<DataRelation> {
    return this.http.post<DataRelation>('/data-entities/relations', payload);
  }

  removeRelation(relationId: string): Observable<void> {
    return this.http.delete<void>(`/data-entities/relations/${relationId}`);
  }
}
