import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

export interface EnqueteReponse {
  id: string;
  repondant: string;
  score: number;
  commentaire?: string | null;
  createdAt: string;
}

export interface EnqueteReponseItem {
  repondant: string;
  score: number;
  commentaire?: string;
}

@Injectable({ providedIn: 'root' })
export class EnqueteReponseService {
  constructor(private http: HttpClient) {}

  /** Utilisé pour le rapport (note moyenne, graphique, commentaires) : a besoin de toutes les réponses. */
  list(): Observable<EnqueteReponse[]> {
    return this.http.get<EnqueteReponse[]>('/enquete-reponses');
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<EnqueteReponse>> {
    return this.http.get<Paginated<EnqueteReponse>>('/enquete-reponses', { params: { page, pageSize } });
  }

  import(items: EnqueteReponseItem[]): Observable<EnqueteReponse[]> {
    return this.http.post<EnqueteReponse[]>('/enquete-reponses/import', { items });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/enquete-reponses/${id}`);
  }
}
