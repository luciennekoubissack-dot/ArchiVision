import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';

/**
 * Service écrit à la main (appels HttpClient directs) en attendant la
 * régénération du client OpenAPI (`npm run generate:api-client`), qui n'était
 * pas exécutable au moment de l'ajout du module Questionnaires.
 */

export type TypeQuestion = 'OUI_NON' | 'CHOIX_MULTIPLE' | 'NOTE_MAX' | 'REPONSE_OUVERTE' | 'SUGGESTION';

export const TYPE_QUESTION_LABEL: Record<TypeQuestion, string> = {
  OUI_NON: 'Oui / Non',
  CHOIX_MULTIPLE: 'Choix multiple',
  NOTE_MAX: 'Note sur un maximum',
  REPONSE_OUVERTE: 'Réponse ouverte',
  SUGGESTION: 'Suggestion',
};

/** Question telle que saisie dans le formulaire (avant persistance). */
export interface QuestionDraft {
  intitule: string;
  type: TypeQuestion;
  options?: string[];
  noteMax?: number;
}

export interface Question {
  id: string;
  intitule: string;
  type: TypeQuestion;
  options: string[];
  noteMax?: number | null;
  ordre: number;
}

export interface Questionnaire {
  id: string;
  titre: string;
  description?: string | null;
  reponseFichierUrl?: string | null;
  reponseFichierNom?: string | null;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { questions: number };
}

export interface QuestionnaireDetail extends Questionnaire {
  questions: Question[];
}

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  private readonly base: string;

  constructor(private http: HttpClient, config: ApiConfiguration) {
    this.base = `${config.rootUrl}/api/v1/questionnaires`;
  }

  list(): Observable<Questionnaire[]> {
    return this.http.get<Questionnaire[]>(this.base);
  }

  get(id: string): Observable<QuestionnaireDetail> {
    return this.http.get<QuestionnaireDetail>(`${this.base}/${id}`);
  }

  create(payload: { titre: string; description?: string; questions: QuestionDraft[] }): Observable<QuestionnaireDetail> {
    return this.http.post<QuestionnaireDetail>(this.base, payload);
  }

  update(
    id: string,
    payload: { titre?: string; description?: string; questions?: QuestionDraft[] },
  ): Observable<QuestionnaireDetail> {
    return this.http.patch<QuestionnaireDetail>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  uploadReponseFichier(id: string, file: File): Observable<QuestionnaireDetail> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<QuestionnaireDetail>(`${this.base}/${id}/reponse-fichier`, form);
  }

  removeReponseFichier(id: string): Observable<Questionnaire> {
    return this.http.delete<Questionnaire>(`${this.base}/${id}/reponse-fichier`);
  }
}
