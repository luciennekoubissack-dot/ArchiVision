import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organisation {
  id: string;
  nom: string;
  description?: string | null;
  logoUrl?: string | null;
  secteur?: string | null;
  taille?: string | null;
  pays?: string | null;
  vision?: string | null;
  problemesResoudre?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganisationPayload {
  nom?: string;
  description?: string;
  logoUrl?: string;
  secteur?: string;
  taille?: string;
  pays?: string;
  vision?: string;
  problemesResoudre?: string;
}

export interface ReferentielExport {
  exportedAt: string;
  organisation: Organisation;
  capacites: unknown[];
  elements: unknown[];
  relations: unknown[];
  applications: unknown[];
  zones: unknown[];
}

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  constructor(private http: HttpClient) {}

  getMine(): Observable<Organisation> {
    return this.http.get<Organisation>('/organisations/me');
  }

  updateMine(payload: UpdateOrganisationPayload): Observable<Organisation> {
    return this.http.patch<Organisation>('/organisations/me', payload);
  }

  exportReferentiel(): Observable<ReferentielExport> {
    return this.http.get<ReferentielExport>('/organisations/me/export');
  }
}
