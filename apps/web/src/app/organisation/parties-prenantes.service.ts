import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

export interface PartiePrenante {
  id: string;
  nom: string;
  role?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PartiesPrenantesService {
  constructor(private http: HttpClient) {}

  /** Utilisé par l'export Excel : a besoin de toutes les parties prenantes. */
  list(): Observable<PartiePrenante[]> {
    return this.http.get<PartiePrenante[]>('/parties-prenantes');
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<PartiePrenante>> {
    return this.http.get<Paginated<PartiePrenante>>('/parties-prenantes', { params: { page, pageSize } });
  }

  create(payload: { nom: string; role?: string }): Observable<PartiePrenante> {
    return this.http.post<PartiePrenante>('/parties-prenantes', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/parties-prenantes/${id}`);
  }
}
