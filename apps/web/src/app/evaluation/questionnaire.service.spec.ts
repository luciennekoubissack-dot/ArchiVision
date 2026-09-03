import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuestionnaireService, QuestionnaireDetail } from './questionnaire.service';

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;
  let httpMock: HttpTestingController;

  const mockDetail: QuestionnaireDetail = {
    id: 'q-001',
    titre: 'Satisfaction',
    description: null,
    reponseFichierUrl: null,
    reponseFichierNom: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    questions: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(QuestionnaireService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('liste les questionnaires', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));
    const req = httpMock.expectOne('/api/v1/questionnaires');
    expect(req.request.method).toBe('GET');
    req.flush([mockDetail]);
    expect(result).toEqual([mockDetail]);
  });

  it('crée un questionnaire avec ses questions', () => {
    service
      .create({
        titre: 'Satisfaction',
        questions: [{ intitule: 'Recommanderiez-vous ?', type: 'OUI_NON' }],
      })
      .subscribe();
    const req = httpMock.expectOne('/api/v1/questionnaires');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.questions[0].type).toBe('OUI_NON');
    req.flush(mockDetail);
  });

  it('met à jour un questionnaire', () => {
    service.update('q-001', { titre: 'Nouveau titre' }).subscribe();
    const req = httpMock.expectOne('/api/v1/questionnaires/q-001');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockDetail, titre: 'Nouveau titre' });
  });

  it('téléverse un fichier de réponse en multipart', () => {
    const file = new File(['x'], 'reponses.pdf', { type: 'application/pdf' });
    service.uploadReponseFichier('q-001', file).subscribe();
    const req = httpMock.expectOne('/api/v1/questionnaires/q-001/reponse-fichier');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockDetail);
  });

  it('détache le fichier de réponse', () => {
    let done = false;
    service.removeReponseFichier('q-001').subscribe(() => (done = true));
    const req = httpMock.expectOne('/api/v1/questionnaires/q-001/reponse-fichier');
    expect(req.request.method).toBe('DELETE');
    req.flush({ ...mockDetail });
    expect(done).toBe(true);
  });

  it('supprime un questionnaire', () => {
    let done = false;
    service.delete('q-001').subscribe(() => (done = true));
    const req = httpMock.expectOne('/api/v1/questionnaires/q-001');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });
});
