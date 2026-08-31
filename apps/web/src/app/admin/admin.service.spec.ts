import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  AdminService,
  OrganisationAdmin,
  OrganisationDetailAdmin,
  UtilisateurAdmin,
  StatsAdmin,
  OrganisationActionResult,
} from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  const mockOrganisation: OrganisationAdmin = {
    id: 'org-001',
    nom: 'ArchiCorp',
    pays: 'France',
    secteur: 'Banque',
    taille: '500-1000',
    statut: 'EN_ATTENTE',
    validatedAt: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    _count: { users: 3 },
  };

  const mockOrganisationDetail: OrganisationDetailAdmin = {
    id: 'org-001',
    nom: 'ArchiCorp',
    description: null,
    logoUrl: null,
    pays: 'France',
    secteur: 'Banque',
    taille: '500-1000',
    problemesResoudre: null,
    vision: null,
    statut: 'EN_ATTENTE',
    validatedAt: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    users: [],
  };

  const mockUtilisateur: UtilisateurAdmin = {
    id: 'user-001',
    nom: 'Alice Dupont',
    email: 'alice@archicorp.test',
    role: 'ADMINISTRATEUR',
    organisation: { id: 'org-001', nom: 'ArchiCorp' },
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  const mockStats: StatsAdmin = {
    totalUtilisateurs: 12,
    organisations: { total: 5, enAttente: 1, validees: 3, rejetees: 1 },
  };

  const mockActionResult: OrganisationActionResult = {
    organisation: {
      id: 'org-001',
      nom: 'ArchiCorp',
      description: null,
      logoUrl: null,
      pays: 'France',
      secteur: 'Banque',
      taille: '500-1000',
      problemesResoudre: null,
      vision: null,
      statut: 'VALIDEE',
      validatedAt: '2026-08-31T10:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-08-31T10:00:00.000Z',
      _count: { users: 3 },
    },
    email: {
      to: 'alice@archicorp.test',
      subject: 'Votre organisation a été validée',
      body: 'Félicitations, votre organisation est validée.',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste les organisations paginées', () => {
    let result: unknown;
    service.listOrganisations(undefined, 1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/admin/organisations?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockOrganisation], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockOrganisation], total: 1, page: 1, pageSize: 20 });
  });

  it("récupère le détail d'une organisation", () => {
    let result: unknown;
    service.getOrganisation(mockOrganisation.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/admin/organisations/${mockOrganisation.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOrganisationDetail);

    expect(result).toEqual(mockOrganisationDetail);
  });

  it('valide une organisation', () => {
    let result: unknown;
    service.valider(mockOrganisation.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/admin/organisations/${mockOrganisation.id}/valider`);
    expect(req.request.method).toBe('POST');
    req.flush(mockActionResult);

    expect(result).toEqual(mockActionResult);
  });

  it('rejette une organisation', () => {
    let result: unknown;
    service.rejeter(mockOrganisation.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/admin/organisations/${mockOrganisation.id}/rejeter`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockActionResult, organisation: { ...mockActionResult.organisation, statut: 'REJETEE' } });

    expect((result as OrganisationActionResult).organisation.statut).toBe('REJETEE');
  });

  it('supprime une organisation', () => {
    let completed = false;
    service.remove(mockOrganisation.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/admin/organisations/${mockOrganisation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('liste les utilisateurs paginés', () => {
    let result: unknown;
    service.listUtilisateurs(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/admin/utilisateurs?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockUtilisateur], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockUtilisateur], total: 1, page: 1, pageSize: 20 });
  });

  it('récupère les statistiques globales', () => {
    let result: unknown;
    service.stats().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/admin/stats');
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);

    expect(result).toEqual(mockStats);
  });
});
