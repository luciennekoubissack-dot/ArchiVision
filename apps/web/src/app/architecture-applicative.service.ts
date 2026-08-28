import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TypeElementArchiApplicative =
  | 'UTILISATEUR_INTERNE'
  | 'UTILISATEUR_EXTERNE'
  | 'APPLICATION'
  | 'BASE_DE_DONNEES'
  | 'SYSTEME_EXTERNE'
  | 'INFRASTRUCTURE'
  | 'SECURITE';

export type TypeFluxArchiApplicative = 'API' | 'DONNEES' | 'AUTHENTIFICATION' | 'RESEAU';

export interface ArchiApplicativeElement {
  id: string;
  nom: string;
  type: TypeElementArchiApplicative;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
}

export interface ArchiApplicativeFlux {
  id: string;
  type: TypeFluxArchiApplicative;
  label?: string | null;
  sourceId: string;
  targetId: string;
}

export interface ArchiApplicativeView {
  svg: string;
  elementCount: number;
  fluxCount: number;
}

@Injectable({ providedIn: 'root' })
export class ArchitectureApplicativeService {
  constructor(private http: HttpClient) {}

  listElements(): Observable<ArchiApplicativeElement[]> {
    return this.http.get<ArchiApplicativeElement[]>('/architecture-applicative/elements');
  }

  createElement(payload: {
    nom: string;
    type: TypeElementArchiApplicative;
    description?: string;
    positionX?: number;
    positionY?: number;
  }): Observable<ArchiApplicativeElement> {
    return this.http.post<ArchiApplicativeElement>('/architecture-applicative/elements', payload);
  }

  updateElement(
    id: string,
    payload: {
      nom?: string;
      type?: TypeElementArchiApplicative;
      description?: string;
      positionX?: number;
      positionY?: number;
    },
  ): Observable<ArchiApplicativeElement> {
    return this.http.patch<ArchiApplicativeElement>(`/architecture-applicative/elements/${id}`, payload);
  }

  deleteElement(id: string): Observable<void> {
    return this.http.delete<void>(`/architecture-applicative/elements/${id}`);
  }

  listFlux(): Observable<ArchiApplicativeFlux[]> {
    return this.http.get<ArchiApplicativeFlux[]>('/architecture-applicative/flux');
  }

  createFlux(payload: {
    sourceId: string;
    targetId: string;
    type?: TypeFluxArchiApplicative;
    label?: string;
  }): Observable<ArchiApplicativeFlux> {
    return this.http.post<ArchiApplicativeFlux>('/architecture-applicative/flux', payload);
  }

  deleteFlux(id: string): Observable<void> {
    return this.http.delete<void>(`/architecture-applicative/flux/${id}`);
  }

  generateView(): Observable<ArchiApplicativeView> {
    return this.http.get<ArchiApplicativeView>('/architecture-applicative/generate-vue');
  }
}
