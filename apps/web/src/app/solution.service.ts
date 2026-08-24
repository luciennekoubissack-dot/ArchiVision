import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatutSolution = 'PROPOSEE' | 'RETENUE' | 'REJETEE';
export type AvancementSolution = 'NON_DEMARRE' | 'EN_COURS' | 'TERMINE' | 'BLOQUE';

export interface EvaluationScore {
  id: string;
  critereId: string;
  score: number;
  commentaire?: string | null;
}

export interface Solution {
  id: string;
  nom: string;
  description?: string | null;
  statut: StatutSolution;
  planMiseOeuvre?: string | null;
  avancement: AvancementSolution;
  commentaireSuivi?: string | null;
  scores: EvaluationScore[];
}

export interface CreateSolutionPayload {
  nom: string;
  description?: string;
  statut?: StatutSolution;
  planMiseOeuvre?: string;
}

export interface UpdateSolutionPayload extends Partial<CreateSolutionPayload> {
  avancement?: AvancementSolution;
  commentaireSuivi?: string;
}

export interface ScoreItem {
  critereId: string;
  score: number;
  commentaire?: string;
}

@Injectable({ providedIn: 'root' })
export class SolutionService {
  constructor(private http: HttpClient) {}

  list(): Observable<Solution[]> {
    return this.http.get<Solution[]>('/solutions');
  }

  create(payload: CreateSolutionPayload): Observable<Solution> {
    return this.http.post<Solution>('/solutions', payload);
  }

  update(id: string, payload: UpdateSolutionPayload): Observable<Solution> {
    return this.http.patch<Solution>(`/solutions/${id}`, payload);
  }

  updateScores(id: string, items: ScoreItem[]): Observable<Solution> {
    return this.http.patch<Solution>(`/solutions/${id}/scores`, { items });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/solutions/${id}`);
  }
}
