import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Criticite = 'HAUTE' | 'MOYENNE' | 'BASSE';
export type TypeZone = 'ZONE' | 'QUARTIER' | 'ILOT';

export interface Application {
  id: string;
  nom: string;
  description?: string | null;
  criticite: Criticite;
  positionX?: number | null;
  positionY?: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { zones: number };
  zones?: { zone: { id: string; nom: string; type: TypeZone } }[];
}

export interface ZoneUrbanisation {
  id: string;
  nom: string;
  type: TypeZone;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  enfants?: ZoneUrbanisation[];
  _count?: { applications: number };
}

export interface UrbanisationView {
  svg: string;
  zoneCount: number;
  applicationCount: number;
}

@Injectable({ providedIn: 'root' })
export class UrbanisationService {
  constructor(private http: HttpClient) {}

  // ── Applications ──────────────────────────────────────────────────────────

  listApplications(): Observable<Application[]> {
    return this.http.get<Application[]>('/applications');
  }

  getApplication(id: string): Observable<Application> {
    return this.http.get<Application>(`/applications/${id}`);
  }

  createApplication(payload: {
    nom: string;
    description?: string;
    criticite?: Criticite;
    positionX?: number;
    positionY?: number;
  }): Observable<Application> {
    return this.http.post<Application>('/applications', payload);
  }

  updateApplication(
    id: string,
    payload: { nom?: string; description?: string; criticite?: Criticite; positionX?: number; positionY?: number },
  ): Observable<Application> {
    return this.http.patch<Application>(`/applications/${id}`, payload);
  }

  deleteApplication(id: string): Observable<void> {
    return this.http.delete<void>(`/applications/${id}`);
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────

  listZones(type?: TypeZone): Observable<ZoneUrbanisation[]> {
    return this.http.get<ZoneUrbanisation[]>('/zones-urbanisation', {
      params: type ? { type } : {},
    });
  }

  createZone(payload: { nom: string; type: TypeZone; parentId?: string }): Observable<ZoneUrbanisation> {
    return this.http.post<ZoneUrbanisation>('/zones-urbanisation', payload);
  }

  updateZone(id: string, payload: { nom?: string; parentId?: string | null }): Observable<ZoneUrbanisation> {
    return this.http.patch<ZoneUrbanisation>(`/zones-urbanisation/${id}`, payload);
  }

  deleteZone(id: string): Observable<void> {
    return this.http.delete<void>(`/zones-urbanisation/${id}`);
  }

  // ── Affectations POS ──────────────────────────────────────────────────────

  affecter(applicationId: string, zoneId: string): Observable<unknown> {
    return this.http.post('/zones-urbanisation/affecter', { applicationId, zoneId });
  }

  desaffecter(zoneId: string, applicationId: string): Observable<void> {
    return this.http.delete<void>(`/zones-urbanisation/${zoneId}/applications/${applicationId}`);
  }

  generateView(): Observable<UrbanisationView> {
    return this.http.get<UrbanisationView>('/zones-urbanisation/generate-vue');
  }
}
