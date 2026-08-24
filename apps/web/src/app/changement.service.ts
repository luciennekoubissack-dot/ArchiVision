import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatutChangement = 'PROPOSE' | 'APPROUVE' | 'REJETE' | 'IMPLEMENTE';

export interface DemandeChangement {
  id: string;
  titre: string;
  description?: string | null;
  statut: StatutChangement;
}

export interface CreateChangementPayload {
  titre: string;
  description?: string;
  statut?: StatutChangement;
}

@Injectable({ providedIn: 'root' })
export class ChangementService {
  constructor(private http: HttpClient) {}

  list(): Observable<DemandeChangement[]> {
    return this.http.get<DemandeChangement[]>('/demandes-changement');
  }

  create(payload: CreateChangementPayload): Observable<DemandeChangement> {
    return this.http.post<DemandeChangement>('/demandes-changement', payload);
  }

  update(id: string, payload: Partial<CreateChangementPayload>): Observable<DemandeChangement> {
    return this.http.patch<DemandeChangement>(`/demandes-changement/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/demandes-changement/${id}`);
  }
}
