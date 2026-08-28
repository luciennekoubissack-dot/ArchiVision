import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RoleUtilisateur } from '../auth/auth.service';
import { Paginated } from '../shared/pagination.interface';

export type StatutOrganisation = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export interface OrganisationAdmin {
  id: string;
  nom: string;
  secteur?: string | null;
  taille?: string | null;
  pays?: string | null;
  statut: StatutOrganisation;
  createdAt: string;
  validatedAt?: string | null;
  _count: { users: number };
}

export interface UtilisateurAdmin {
  id: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  createdAt: string;
  organisation: { id: string; nom: string } | null;
}

export interface OrganisationDetailAdmin extends OrganisationAdmin {
  description?: string | null;
  logoUrl?: string | null;
  users: { id: string; nom: string; email: string; role: RoleUtilisateur; createdAt: string }[];
}

export interface SimulatedEmail {
  to: string;
  subject: string;
  body: string;
}

export interface StatsAdmin {
  totalUtilisateurs: number;
  organisations: { enAttente: number; validees: number; rejetees: number; total: number };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  listOrganisations(statut: StatutOrganisation | undefined, page: number, pageSize: number): Observable<Paginated<OrganisationAdmin>> {
    return this.http.get<Paginated<OrganisationAdmin>>('/admin/organisations', {
      params: { ...(statut ? { statut } : {}), page, pageSize },
    });
  }

  getOrganisation(id: string): Observable<OrganisationDetailAdmin> {
    return this.http.get<OrganisationDetailAdmin>(`/admin/organisations/${id}`);
  }

  valider(id: string): Observable<{ organisation: OrganisationAdmin; email: SimulatedEmail }> {
    return this.http.post<{ organisation: OrganisationAdmin; email: SimulatedEmail }>(
      `/admin/organisations/${id}/valider`,
      {},
    );
  }

  rejeter(id: string): Observable<{ organisation: OrganisationAdmin; email: SimulatedEmail }> {
    return this.http.post<{ organisation: OrganisationAdmin; email: SimulatedEmail }>(
      `/admin/organisations/${id}/rejeter`,
      {},
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/admin/organisations/${id}`);
  }

  listUtilisateurs(page: number, pageSize: number): Observable<Paginated<UtilisateurAdmin>> {
    return this.http.get<Paginated<UtilisateurAdmin>>('/admin/utilisateurs', { params: { page, pageSize } });
  }

  stats(): Observable<StatsAdmin> {
    return this.http.get<StatsAdmin>('/admin/stats');
  }
}
