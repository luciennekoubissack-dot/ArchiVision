import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangementService, DemandeChangement } from './changement.service';

describe('ChangementService', () => {
  let service: ChangementService;
  let httpMock: HttpTestingController;

  const mockChangement: DemandeChangement = {
    id: 'changement-001',
    titre: 'Migrer vers TLS 1.3',
    description: null,
    statut: 'PROPOSE',
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChangementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste les demandes de changement paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/demandes-changement?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockChangement], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockChangement], total: 1, page: 1, pageSize: 20 });
  });

  it('récupère les statistiques (compte total et en cours) sans charger la liste complète', () => {
    let result: unknown;
    service.stats().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/demandes-changement/stats');
    expect(req.request.method).toBe('GET');
    req.flush({ total: 5, enCours: 2 });

    expect(result).toEqual({ total: 5, enCours: 2 });
  });

  it('crée une demande de changement', () => {
    let result: unknown;
    service.create({ titre: mockChangement.titre }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/demandes-changement');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ titre: mockChangement.titre });
    req.flush(mockChangement);

    expect(result).toEqual(mockChangement);
  });

  it('met à jour le statut d\'une demande de changement', () => {
    let result: unknown;
    service.update(mockChangement.id, { statut: 'APPROUVE' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/demandes-changement/${mockChangement.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockChangement, statut: 'APPROUVE' });

    expect((result as DemandeChangement).statut).toBe('APPROUVE');
  });

  it('supprime une demande de changement', () => {
    let completed = false;
    service.delete(mockChangement.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/demandes-changement/${mockChangement.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
