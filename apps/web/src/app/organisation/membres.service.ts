import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleUtilisateur } from '../auth/auth.service';
import { Paginated } from '../shared/pagination.interface';

export interface Membre {
  id: string;
  email: string;
  nom: string;
  role: RoleUtilisateur;
  serviceId?: string | null;
  poste?: string | null;
  contact?: string | null;
  createdAt: string;
}

export interface CreateMembrePayload {
  email: string;
  password: string;
  nom: string;
  role: RoleUtilisateur;
  serviceId?: string;
  poste?: string;
  contact?: string;
}

export interface UpdateMembrePayload {
  role?: RoleUtilisateur;
  serviceId?: string | null;
  poste?: string;
  contact?: string;
}

@Injectable({ providedIn: 'root' })
export class MembresService {
  constructor(private http: HttpClient) {}

  /** Utilisé pour un simple comptage (ex. tableau de bord) : pas de pagination. */
  list(): Observable<Membre[]> {
    return this.http.get<Membre[]>('/membres');
  }

  listPaginated(page: number, pageSize: number): Observable<Paginated<Membre>> {
    return this.http.get<Paginated<Membre>>('/membres', { params: { page, pageSize } });
  }

  create(payload: CreateMembrePayload): Observable<Membre> {
    return this.http.post<Membre>('/membres', payload);
  }

  update(id: string, payload: UpdateMembrePayload): Observable<Membre> {
    return this.http.patch<Membre>(`/membres/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/membres/${id}`);
  }
}
