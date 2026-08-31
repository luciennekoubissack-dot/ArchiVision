import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PolitiqueService, Politique } from './politique.service';

describe('PolitiqueService', () => {
  let service: PolitiqueService;
  let httpMock: HttpTestingController;

  const mockPolitique: Politique = {
    id: 'politique-001',
    nom: 'Politique de sécurité des données',
    description: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PolitiqueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les politiques', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/politiques-gouvernance');
    expect(req.request.method).toBe('GET');
    req.flush([mockPolitique]);

    expect(result).toEqual([mockPolitique]);
  });

  it('liste les politiques paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/politiques-gouvernance?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockPolitique], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockPolitique], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une politique', () => {
    let result: unknown;
    service.create({ nom: mockPolitique.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/politiques-gouvernance');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockPolitique.nom });
    req.flush(mockPolitique);

    expect(result).toEqual(mockPolitique);
  });

  it('supprime une politique', () => {
    let completed = false;
    service.delete(mockPolitique.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/politiques-gouvernance/${mockPolitique.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
