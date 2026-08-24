import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  list(): Observable<EnqueteReponse[]> {
    return this.http.get<EnqueteReponse[]>('/enquete-reponses');
  }

  import(items: EnqueteReponseItem[]): Observable<EnqueteReponse[]> {
    return this.http.post<EnqueteReponse[]>('/enquete-reponses/import', { items });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/enquete-reponses/${id}`);
  }
}
