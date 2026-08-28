import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type PrioriteProjet = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type StatutProjet = 'PLANIFIE' | 'EN_COURS' | 'TERMINE';

export interface Projet {
  id: string;
  nom: string;
  description?: string | null;
  priorite: PrioriteProjet;
  coutEstime?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  statut: StatutProjet;
}

export interface CreateProjetPayload {
  nom: string;
  description?: string;
  priorite?: PrioriteProjet;
  coutEstime?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface UpdateProjetPayload extends Partial<CreateProjetPayload> {
  statut?: StatutProjet;
}

@Injectable({ providedIn: 'root' })
export class RoadmapService {
  constructor(private http: HttpClient) {}

  list(): Observable<Projet[]> {
    return this.http.get<Projet[]>('/projets');
  }

  create(payload: CreateProjetPayload): Observable<Projet> {
    return this.http.post<Projet>('/projets', payload);
  }

  update(id: string, payload: UpdateProjetPayload): Observable<Projet> {
    return this.http.patch<Projet>(`/projets/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/projets/${id}`);
  }
}
