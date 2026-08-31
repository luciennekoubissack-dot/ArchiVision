import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CritereEvaluationService, CritereEvaluation } from './critere-evaluation.service';

describe('CritereEvaluationService', () => {
  let service: CritereEvaluationService;
  let httpMock: HttpTestingController;

  const mockCritere: CritereEvaluation = {
    id: 'critere-001',
    nom: 'Coût de mise en oeuvre',
    description: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CritereEvaluationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les critères d\'évaluation', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/criteres-evaluation');
    expect(req.request.method).toBe('GET');
    req.flush([mockCritere]);

    expect(result).toEqual([mockCritere]);
  });

  it('crée un critère d\'évaluation', () => {
    let result: unknown;
    service.create({ nom: mockCritere.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/criteres-evaluation');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockCritere.nom });
    req.flush(mockCritere);

    expect(result).toEqual(mockCritere);
  });

  it('supprime un critère d\'évaluation', () => {
    let completed = false;
    service.delete(mockCritere.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/criteres-evaluation/${mockCritere.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
