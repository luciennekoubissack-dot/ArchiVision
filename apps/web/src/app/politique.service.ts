import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  list(): Observable<Politique[]> {
    return this.http.get<Politique[]>('/politiques-gouvernance');
  }

  create(payload: CreatePolitiquePayload): Observable<Politique> {
    return this.http.post<Politique>('/politiques-gouvernance', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/politiques-gouvernance/${id}`);
  }
}
