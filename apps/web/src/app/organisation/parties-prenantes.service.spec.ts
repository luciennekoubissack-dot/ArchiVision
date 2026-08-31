import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PartiesPrenantesService, PartiePrenante } from './parties-prenantes.service';

describe('PartiesPrenantesService', () => {
  let service: PartiesPrenantesService;
  let httpMock: HttpTestingController;

  const mockPartiePrenante: PartiePrenante = {
    id: 'partie-001',
    nom: 'Direction financière',
    role: 'Sponsor',
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PartiesPrenantesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les parties prenantes', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/parties-prenantes');
    expect(req.request.method).toBe('GET');
    req.flush([mockPartiePrenante]);

    expect(result).toEqual([mockPartiePrenante]);
  });

  it('liste les parties prenantes paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/parties-prenantes?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockPartiePrenante], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockPartiePrenante], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une partie prenante', () => {
    let result: unknown;
    service.create({ nom: mockPartiePrenante.nom, role: mockPartiePrenante.role as string }).subscribe(
      (r) => (result = r),
    );

    const req = httpMock.expectOne('/api/v1/parties-prenantes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockPartiePrenante.nom, role: mockPartiePrenante.role });
    req.flush(mockPartiePrenante);

    expect(result).toEqual(mockPartiePrenante);
  });

  it('supprime une partie prenante', () => {
    let completed = false;
    service.delete(mockPartiePrenante.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/parties-prenantes/${mockPartiePrenante.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
