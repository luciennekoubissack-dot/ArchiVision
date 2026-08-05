import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleUtilisateur } from './auth.service';

export interface Membre {
  id: string;
  email: string;
  nom: string;
  role: RoleUtilisateur;
  serviceId?: string | null;
  createdAt: string;
}

export interface CreateMembrePayload {
  email: string;
  password: string;
  nom: string;
  role: RoleUtilisateur;
  serviceId?: string;
}

export interface UpdateMembrePayload {
  role?: RoleUtilisateur;
  serviceId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class MembresService {
  constructor(private http: HttpClient) {}

  list(): Observable<Membre[]> {
    return this.http.get<Membre[]>('/membres');
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
