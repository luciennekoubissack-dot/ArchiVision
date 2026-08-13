import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  list(): Observable<Objectif[]> {
    return this.http.get<Objectif[]>('/objectifs');
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
