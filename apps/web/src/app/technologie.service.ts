import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeTechComponent = 'SERVEUR' | 'RESEAU' | 'CLOUD' | 'BASE_DE_DONNEES' | 'MIDDLEWARE';
export type StatutElement = 'AS_IS' | 'TO_BE' | 'LES_DEUX';

export interface TechDeploiement {
  applicationId: string;
  techComponentId: string;
  application: { id: string; nom: string };
}

export interface TechComponent {
  id: string;
  nom: string;
  type: TypeTechComponent;
  description?: string | null;
  statut: StatutElement;
  positionX?: number | null;
  positionY?: number | null;
  deploiements: TechDeploiement[];
}

@Injectable({ providedIn: 'root' })
export class TechnologieService {
  constructor(private http: HttpClient) {}

  list(): Observable<TechComponent[]> {
    return this.http.get<TechComponent[]>('/tech-components');
  }

  create(payload: {
    nom: string;
    type: TypeTechComponent;
    description?: string;
    positionX?: number;
    positionY?: number;
  }): Observable<TechComponent> {
    return this.http.post<TechComponent>('/tech-components', payload);
  }

  update(
    id: string,
    payload: { nom?: string; type?: TypeTechComponent; description?: string; positionX?: number; positionY?: number },
  ): Observable<TechComponent> {
    return this.http.patch<TechComponent>(`/tech-components/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/tech-components/${id}`);
  }

  deployer(payload: { applicationId: string; techComponentId: string }): Observable<TechDeploiement> {
    return this.http.post<TechDeploiement>('/tech-components/deployer', payload);
  }

  undeployer(techComponentId: string, applicationId: string): Observable<void> {
    return this.http.delete<void>(`/tech-components/${techComponentId}/applications/${applicationId}`);
  }
}
