import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeRelation } from './archimate.service';

export type ElementKind = 'ARCHIMATE' | 'APPLICATION' | 'TECH_COMPONENT' | 'DATA_ENTITY';

export interface CanevasRelation {
  id: string;
  type: TypeRelation;
  sourceKind: ElementKind;
  sourceId: string;
  targetKind: ElementKind;
  targetId: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CanevasService {
  constructor(private http: HttpClient) {}

  listRelations(): Observable<CanevasRelation[]> {
    return this.http.get<CanevasRelation[]>('/canevas-relations');
  }

  createRelation(payload: {
    type: TypeRelation;
    sourceKind: ElementKind;
    sourceId: string;
    targetKind: ElementKind;
    targetId: string;
  }): Observable<CanevasRelation> {
    return this.http.post<CanevasRelation>('/canevas-relations', payload);
  }

  deleteRelation(id: string): Observable<void> {
    return this.http.delete<void>(`/canevas-relations/${id}`);
  }
}
