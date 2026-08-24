import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type StatutConformite = 'CONFORME' | 'NON_CONFORME' | 'A_EVALUER';

export interface ConformiteSolution {
  id: string;
  politiqueId: string;
  statut: StatutConformite;
  commentaire?: string | null;
}

export interface ConformiteItem {
  politiqueId: string;
  statut: StatutConformite;
  commentaire?: string;
}

@Injectable({ providedIn: 'root' })
export class ConformiteService {
  constructor(private http: HttpClient) {}

  listAll(): Observable<(ConformiteSolution & { solution: { id: string; nom: string } })[]> {
    return this.http.get<(ConformiteSolution & { solution: { id: string; nom: string } })[]>('/conformites-solutions');
  }

  updateConformites(solutionId: string, items: ConformiteItem[]): Observable<ConformiteSolution[]> {
    return this.http.patch<ConformiteSolution[]>(`/conformites-solutions/${solutionId}`, { items });
  }
}
