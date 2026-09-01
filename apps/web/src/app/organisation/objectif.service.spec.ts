import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ObjectifService, Objectif } from './objectif.service';

describe('ObjectifService', () => {
  let service: ObjectifService;
  let httpMock: HttpTestingController;

  const mockObjectif: Objectif = {
    id: 'objectif-001',
    nom: 'Réduire les coûts IT',
    description: null,
    sousObjectif: null,
    statut: 'LES_DEUX',
    objectifAsIsId: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ObjectifService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les objectifs', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/objectifs');
    expect(req.request.method).toBe('GET');
    req.flush([mockObjectif]);

    expect(result).toEqual([mockObjectif]);
  });

  it('liste les objectifs paginés', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/objectifs?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockObjectif], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockObjectif], total: 1, page: 1, pageSize: 20 });
  });

  it('crée un objectif', () => {
    let result: unknown;
    service.create({ nom: mockObjectif.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/objectifs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockObjectif.nom });
    req.flush(mockObjectif);

    expect(result).toEqual(mockObjectif);
  });

  it('met à jour un objectif', () => {
    let result: unknown;
    service.update(mockObjectif.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/objectifs/${mockObjectif.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockObjectif, nom: 'Nouveau nom' });

    expect((result as Objectif).nom).toBe('Nouveau nom');
  });

  it('supprime un objectif', () => {
    let completed = false;
    service.delete(mockObjectif.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/objectifs/${mockObjectif.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
