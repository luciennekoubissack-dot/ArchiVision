import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

export interface Politique {
  id: string;
  nom: string;
  description?: string | null;
}

export interface CreatePolitiquePayload {
  nom: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PolitiqueService {
  constructor(private http: HttpClient) {}

  /** Utilisé comme en-têtes de colonnes de la matrice de conformité : a besoin de toutes les politiques. */
  list(): Observable<Politique[]> {
    return this.http.get<Politique[]>('/politiques-gouvernance');
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Politique>> {
    return this.http.get<Paginated<Politique>>('/politiques-gouvernance', { params: { page, pageSize } });
  }

  create(payload: CreatePolitiquePayload): Observable<Politique> {
    return this.http.post<Politique>('/politiques-gouvernance', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/politiques-gouvernance/${id}`);
  }
}
