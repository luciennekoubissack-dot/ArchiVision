import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganisationService, Organisation } from './organisation.service';

describe('OrganisationService', () => {
  let service: OrganisationService;
  let httpMock: HttpTestingController;

  const mockOrganisation: Organisation = {
    id: 'org-001',
    nom: 'ArchiVision SA',
    description: null,
    logoUrl: null,
    pays: 'France',
    problemesResoudre: null,
    secteur: 'Technologie',
    statut: 'VALIDEE',
    taille: null,
    vision: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrganisationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('récupère l\'organisation courante', () => {
    let result: unknown;
    service.getMine().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/organisations/me');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrganisation);

    expect(result).toEqual(mockOrganisation);
  });

  it('met à jour l\'organisation courante', () => {
    let result: unknown;
    service.updateMine({ nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/organisations/me');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nom: 'Nouveau nom' });
    req.flush({ ...mockOrganisation, nom: 'Nouveau nom' });

    expect((result as Organisation).nom).toBe('Nouveau nom');
  });

  it('exporte le référentiel de l\'organisation courante', () => {
    const mockExport = {
      applications: [],
      capacites: [],
      elements: [],
      exportedAt: '2026-07-01T10:00:00.000Z',
      organisation: mockOrganisation,
      relations: [],
      zones: [],
    };
    let result: unknown;
    service.exportReferentiel().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/organisations/me/export');
    expect(req.request.method).toBe('GET');
    req.flush(mockExport);

    expect(result).toEqual(mockExport);
  });
});
