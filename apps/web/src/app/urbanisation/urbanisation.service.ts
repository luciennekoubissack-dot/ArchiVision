import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../shared/pagination.interface';

export type TypeZone = 'ZONE' | 'QUARTIER' | 'ILOT';

export interface Application {
  id: string;
  nom: string;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { zones: number; services: number; echangesSource: number; echangesTarget: number };
  zones?: { zone: { id: string; nom: string; type: TypeZone } }[];
  services?: ApplicationServiceItem[];
  echangesSource?: ApplicationEchangeLink[];
  echangesTarget?: ApplicationEchangeLink[];
}

export interface ApplicationServiceItem {
  id: string;
  nom: string;
  description?: string | null;
  applicationId: string;
}

export interface ApplicationEchange {
  id: string;
  sourceId: string;
  targetId: string;
  description?: string | null;
  protocole?: string | null;
  createdAt: string;
  source: Application;
  target: Application;
}

/** Échange vu depuis une seule application (fiche détail) : ne référence que l'application à l'autre bout du lien. */
export interface ApplicationEchangeLink {
  id: string;
  description?: string | null;
  protocole?: string | null;
  source?: { id: string; nom: string };
  target?: { id: string; nom: string };
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

export interface ComponentsView {
  svg: string;
  applicationCount: number;
  echangeCount: number;
}

@Injectable({ providedIn: 'root' })
export class UrbanisationService {
  constructor(private http: HttpClient) {}

  // ── Applications ──────────────────────────────────────────────────────────

  /** Utilisé par le canevas interactif et le formulaire d'affectation (Zones) : a besoin de toutes les applications. */
  listApplications(): Observable<Application[]> {
    return this.http.get<Application[]>('/applications');
  }

  listApplicationsPaginated(page: number, pageSize: number): Observable<Paginated<Application>> {
    return this.http.get<Paginated<Application>>('/applications', { params: { page, pageSize } });
  }

  getApplication(id: string): Observable<Application> {
    return this.http.get<Application>(`/applications/${id}`);
  }

  createApplication(payload: {
    nom: string;
    description?: string;
    positionX?: number;
    positionY?: number;
  }): Observable<Application> {
    return this.http.post<Application>('/applications', payload);
  }

  updateApplication(
    id: string,
    payload: { nom?: string; description?: string; positionX?: number; positionY?: number },
  ): Observable<Application> {
    return this.http.patch<Application>(`/applications/${id}`, payload);
  }

  deleteApplication(id: string): Observable<void> {
    return this.http.delete<void>(`/applications/${id}`);
  }

  generateComponentsView(): Observable<ComponentsView> {
    return this.http.get<ComponentsView>('/applications/generate-vue');
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

  // ── Services applicatifs ────────────────────────────────────────────────────

  addService(applicationId: string, payload: { nom: string; description?: string }): Observable<ApplicationServiceItem> {
    return this.http.post<ApplicationServiceItem>(`/applications/${applicationId}/services`, payload);
  }

  removeService(serviceId: string): Observable<void> {
    return this.http.delete<void>(`/applications/services/${serviceId}`);
  }

  // ── Échanges applicatifs (diagramme de composants UML) ─────────────────────

  listEchanges(): Observable<ApplicationEchange[]> {
    return this.http.get<ApplicationEchange[]>('/applications-echanges');
  }

  createEchange(payload: {
    sourceId: string;
    targetId: string;
    description?: string;
    protocole?: string;
  }): Observable<ApplicationEchange> {
    return this.http.post<ApplicationEchange>('/applications-echanges', payload);
  }

  deleteEchange(id: string): Observable<void> {
    return this.http.delete<void>(`/applications-echanges/${id}`);
  }
}
