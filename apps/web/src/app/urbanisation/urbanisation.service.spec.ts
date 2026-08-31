import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  UrbanisationService,
  Application,
  ApplicationEchange,
  ApplicationServiceItem,
  ZoneUrbanisation,
} from './urbanisation.service';

describe('UrbanisationService', () => {
  let service: UrbanisationService;
  let httpMock: HttpTestingController;

  const mockApplication: Application = {
    id: 'application-001',
    nom: 'Portail RH',
    description: null,
    statut: 'AS_IS',
    positionX: 0,
    positionY: 0,
    organisationId: 'org-001',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockApplicationCible: Application = {
    id: 'application-002',
    nom: 'Référentiel Client',
    description: null,
    statut: 'AS_IS',
    positionX: 100,
    positionY: 100,
    organisationId: 'org-001',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockZone: ZoneUrbanisation = {
    id: 'zone-001',
    nom: 'Zone Métier',
    type: 'ZONE',
    parentId: null,
    organisationId: 'org-001',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockService: ApplicationServiceItem = {
    id: 'service-001',
    nom: 'API de recherche',
    description: null,
    applicationId: mockApplication.id,
  };

  const mockEchange: ApplicationEchange = {
    id: 'echange-001',
    description: null,
    protocole: 'REST',
    source: mockApplication,
    sourceId: mockApplication.id,
    target: mockApplicationCible,
    targetId: mockApplicationCible.id,
    createdAt: '2026-08-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UrbanisationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Applications ──────────────────────────────────────────────────────────

  it('liste toutes les applications', () => {
    let result: unknown;
    service.listApplications().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications');
    expect(req.request.method).toBe('GET');
    req.flush([mockApplication]);

    expect(result).toEqual([mockApplication]);
  });

  it('liste les applications paginées', () => {
    let result: unknown;
    service.listApplicationsPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockApplication], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockApplication], total: 1, page: 1, pageSize: 20 });
  });

  it('récupère une application par son identifiant', () => {
    let result: unknown;
    service.getApplication(mockApplication.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/applications/${mockApplication.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApplication);

    expect(result).toEqual(mockApplication);
  });

  it('crée une application', () => {
    let result: unknown;
    service.createApplication({ nom: mockApplication.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockApplication.nom });
    req.flush(mockApplication);

    expect(result).toEqual(mockApplication);
  });

  it('met à jour une application', () => {
    let result: unknown;
    service.updateApplication(mockApplication.id, { nom: 'Portail RH v2' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/applications/${mockApplication.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockApplication, nom: 'Portail RH v2' });

    expect((result as Application).nom).toBe('Portail RH v2');
  });

  it('supprime une application', () => {
    let completed = false;
    service.deleteApplication(mockApplication.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/applications/${mockApplication.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la vue du diagramme de composants', () => {
    let result: unknown;
    service.generateComponentsView().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications/generate-vue');
    expect(req.request.method).toBe('GET');
    req.flush({ applicationCount: 1, echangeCount: 0, svg: '<svg></svg>' });

    expect(result).toEqual({ applicationCount: 1, echangeCount: 0, svg: '<svg></svg>' });
  });

  // ── Zones d'urbanisation ──────────────────────────────────────────────────

  it('liste les zones d\'urbanisation sans filtre de type', () => {
    let result: unknown;
    service.listZones().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/zones-urbanisation');
    expect(req.request.method).toBe('GET');
    req.flush([mockZone]);

    expect(result).toEqual([mockZone]);
  });

  it('liste les zones d\'urbanisation filtrées par type', () => {
    let result: unknown;
    service.listZones('ZONE').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/zones-urbanisation?type=ZONE');
    expect(req.request.method).toBe('GET');
    req.flush([mockZone]);

    expect(result).toEqual([mockZone]);
  });

  it('crée une zone d\'urbanisation', () => {
    let result: unknown;
    service.createZone({ nom: mockZone.nom, type: mockZone.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/zones-urbanisation');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockZone.nom, type: mockZone.type });
    req.flush(mockZone);

    expect(result).toEqual(mockZone);
  });

  it('met à jour une zone d\'urbanisation', () => {
    let result: unknown;
    service.updateZone(mockZone.id, { nom: 'Zone Métier v2' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/zones-urbanisation/${mockZone.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockZone, nom: 'Zone Métier v2' });

    expect((result as ZoneUrbanisation).nom).toBe('Zone Métier v2');
  });

  it('supprime une zone d\'urbanisation', () => {
    let completed = false;
    service.deleteZone(mockZone.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/zones-urbanisation/${mockZone.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  // ── Affectations POS ──────────────────────────────────────────────────────

  it('affecte une application à une zone', () => {
    let result: unknown;
    service.affecter(mockApplication.id, mockZone.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/zones-urbanisation/affecter');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ applicationId: mockApplication.id, zoneId: mockZone.id });
    const mockAffectation = {
      application: { id: mockApplication.id, nom: mockApplication.nom },
      applicationId: mockApplication.id,
      zone: { id: mockZone.id, nom: mockZone.nom },
      zoneId: mockZone.id,
    };
    req.flush(mockAffectation);

    expect(result).toEqual(mockAffectation);
  });

  it('désaffecte une application d\'une zone', () => {
    let completed = false;
    service.desaffecter(mockZone.id, mockApplication.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/zones-urbanisation/${mockZone.id}/applications/${mockApplication.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la vue du diagramme d\'urbanisation', () => {
    let result: unknown;
    service.generateView().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/zones-urbanisation/generate-vue');
    expect(req.request.method).toBe('GET');
    req.flush({ applicationCount: 1, zoneCount: 1, svg: '<svg></svg>' });

    expect(result).toEqual({ applicationCount: 1, zoneCount: 1, svg: '<svg></svg>' });
  });

  // ── Services applicatifs ─────────────────────────────────────────────────

  it('ajoute un service applicatif à une application', () => {
    let result: unknown;
    service.addService(mockApplication.id, { nom: mockService.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/applications/${mockApplication.id}/services`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockService.nom });
    req.flush(mockService);

    expect(result).toEqual(mockService);
  });

  it('supprime un service applicatif', () => {
    let completed = false;
    service.removeService(mockService.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/applications/services/${mockService.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  // ── Échanges applicatifs ──────────────────────────────────────────────────

  it('liste les échanges applicatifs', () => {
    let result: unknown;
    service.listEchanges().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications-echanges');
    expect(req.request.method).toBe('GET');
    req.flush([mockEchange]);

    expect(result).toEqual([mockEchange]);
  });

  it('crée un échange applicatif', () => {
    let result: unknown;
    service
      .createEchange({ sourceId: mockApplication.id, targetId: mockApplicationCible.id })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/applications-echanges');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sourceId: mockApplication.id, targetId: mockApplicationCible.id });
    req.flush(mockEchange);

    expect(result).toEqual(mockEchange);
  });

  it('supprime un échange applicatif', () => {
    let completed = false;
    service.deleteEchange(mockEchange.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/applications-echanges/${mockEchange.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
