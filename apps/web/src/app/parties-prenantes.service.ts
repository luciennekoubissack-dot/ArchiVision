import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PartiePrenante {
  id: string;
  nom: string;
  role?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PartiesPrenantesService {
  constructor(private http: HttpClient) {}

  list(): Observable<PartiePrenante[]> {
    return this.http.get<PartiePrenante[]>('/parties-prenantes');
  }

  create(payload: { nom: string; role?: string }): Observable<PartiePrenante> {
    return this.http.post<PartiePrenante>('/parties-prenantes', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/parties-prenantes/${id}`);
  }
}
