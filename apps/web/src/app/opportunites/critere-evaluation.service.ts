import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CritereEvaluation {
  id: string;
  nom: string;
  description?: string | null;
}

export interface CreateCritereEvaluationPayload {
  nom: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CritereEvaluationService {
  constructor(private http: HttpClient) {}

  list(): Observable<CritereEvaluation[]> {
    return this.http.get<CritereEvaluation[]>('/criteres-evaluation');
  }

  create(payload: CreateCritereEvaluationPayload): Observable<CritereEvaluation> {
    return this.http.post<CritereEvaluation>('/criteres-evaluation', payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/criteres-evaluation/${id}`);
  }
}
