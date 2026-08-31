import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RoadmapService, Projet } from './roadmap.service';

describe('RoadmapService', () => {
  let service: RoadmapService;
  let httpMock: HttpTestingController;

  const mockProjet: Projet = {
    id: 'projet-001',
    nom: 'Migration cloud',
    priorite: 'HAUTE',
    statut: 'PLANIFIE',
    description: null,
    coutEstime: null,
    dateDebut: null,
    dateFin: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoadmapService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les projets', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/projets');
    expect(req.request.method).toBe('GET');
    req.flush([mockProjet]);

    expect(result).toEqual([mockProjet]);
  });

  it('liste les projets paginés', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/projets?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockProjet], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockProjet], total: 1, page: 1, pageSize: 20 });
  });

  it('crée un projet', () => {
    let result: unknown;
    service.create({ nom: mockProjet.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/projets');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockProjet.nom });
    req.flush(mockProjet);

    expect(result).toEqual(mockProjet);
  });

  it('met à jour un projet', () => {
    let result: unknown;
    service.update(mockProjet.id, { statut: 'EN_COURS' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/projets/${mockProjet.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockProjet, statut: 'EN_COURS' });

    expect((result as Projet).statut).toBe('EN_COURS');
  });

  it('supprime un projet', () => {
    let completed = false;
    service.delete(mockProjet.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/projets/${mockProjet.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
