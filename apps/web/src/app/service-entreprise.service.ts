import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ServiceEntreprise {
  id: string;
  nom: string;
  description?: string | null;
  parentId?: string | null;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  enfants?: ServiceEntreprise[];
  _count?: { membres: number };
}

export interface CreateServiceEntreprisePayload {
  nom: string;
  description?: string;
  parentId?: string;
}

export interface UpdateServiceEntreprisePayload {
  nom?: string;
  description?: string;
  parentId?: string | null;
}

export interface OrganigrammeView {
  svg: string;
  serviceCount: number;
  membreCount: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceEntrepriseService {
  constructor(private http: HttpClient) {}

  list(): Observable<ServiceEntreprise[]> {
    return this.http.get<ServiceEntreprise[]>('/services');
  }

  create(payload: CreateServiceEntreprisePayload): Observable<ServiceEntreprise> {
    return this.http.post<ServiceEntreprise>('/services', payload);
  }

  update(id: string, payload: UpdateServiceEntreprisePayload): Observable<ServiceEntreprise> {
    return this.http.patch<ServiceEntreprise>(`/services/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/services/${id}`);
  }

  generateView(): Observable<OrganigrammeView> {
    return this.http.get<OrganigrammeView>('/services/generate-vue');
  }
}
