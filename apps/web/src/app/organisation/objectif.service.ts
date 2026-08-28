import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

export interface Objectif {
  id: string;
  nom: string;
  description?: string | null;
  sousObjectif?: string | null;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectifPayload {
  nom: string;
  description?: string;
  sousObjectif?: string;
}

export interface UpdateObjectifPayload {
  nom?: string;
  description?: string;
  sousObjectif?: string;
}

@Injectable({ providedIn: 'root' })
export class ObjectifService {
  constructor(private http: HttpClient) {}

  /** Utilisé par l'export Excel : a besoin de tous les objectifs. */
  list(): Observable<Objectif[]> {
    return this.http.get<Objectif[]>('/objectifs');
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Objectif>> {
    return this.http.get<Paginated<Objectif>>('/objectifs', { params: { page, pageSize } });
  }

  create(payload: CreateObjectifPayload): Observable<Objectif> {
    return this.http.post<Objectif>('/objectifs', payload);
  }

  update(id: string, payload: UpdateObjectifPayload): Observable<Objectif> {
    return this.http.patch<Objectif>(`/objectifs/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/objectifs/${id}`);
  }
}
