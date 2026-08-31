import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EnqueteReponseService, EnqueteReponse } from './enquete-reponse.service';

describe('EnqueteReponseService', () => {
  let service: EnqueteReponseService;
  let httpMock: HttpTestingController;

  const mockReponse: EnqueteReponse = {
    id: 'reponse-001',
    repondant: 'Alice Dupont',
    score: 4,
    commentaire: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnqueteReponseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("liste toutes les réponses à l'enquête", () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/enquete-reponses');
    expect(req.request.method).toBe('GET');
    req.flush([mockReponse]);

    expect(result).toEqual([mockReponse]);
  });

  it("liste les réponses à l'enquête paginées", () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/enquete-reponses?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockReponse], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockReponse], total: 1, page: 1, pageSize: 20 });
  });

  it('importe une liste de réponses', () => {
    let result: unknown;
    const items = [{ repondant: mockReponse.repondant, score: mockReponse.score }];
    service.import(items).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/enquete-reponses/import');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ items });
    req.flush([mockReponse]);

    expect(result).toEqual([mockReponse]);
  });

  it('supprime une réponse', () => {
    let completed = false;
    service.delete(mockReponse.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/enquete-reponses/${mockReponse.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
