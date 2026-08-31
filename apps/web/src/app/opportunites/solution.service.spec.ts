import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SolutionService, Solution } from './solution.service';

describe('SolutionService', () => {
  let service: SolutionService;
  let httpMock: HttpTestingController;

  const mockSolution: Solution = {
    id: 'solution-001',
    nom: 'CRM Cloud',
    description: null,
    statut: 'PROPOSEE',
    avancement: 'NON_DEMARRE',
    commentaireSuivi: null,
    planMiseOeuvre: null,
    scores: [],
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SolutionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les solutions', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/solutions');
    expect(req.request.method).toBe('GET');
    req.flush([mockSolution]);

    expect(result).toEqual([mockSolution]);
  });

  it('liste les solutions paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/solutions?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockSolution], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockSolution], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une solution', () => {
    let result: unknown;
    service.create({ nom: mockSolution.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/solutions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockSolution.nom });
    req.flush(mockSolution);

    expect(result).toEqual(mockSolution);
  });

  it('met à jour une solution', () => {
    let result: unknown;
    service.update(mockSolution.id, { statut: 'RETENUE' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/solutions/${mockSolution.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockSolution, statut: 'RETENUE' });

    expect((result as Solution).statut).toBe('RETENUE');
  });

  it('met à jour les scores d\'une solution', () => {
    let result: unknown;
    const items = [{ critereId: 'critere-001', score: 4 }];
    service.updateScores(mockSolution.id, items).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/solutions/${mockSolution.id}/scores`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items });
    req.flush(mockSolution);

    expect(result).toEqual(mockSolution);
  });

  it('supprime une solution', () => {
    let completed = false;
    service.delete(mockSolution.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/solutions/${mockSolution.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
