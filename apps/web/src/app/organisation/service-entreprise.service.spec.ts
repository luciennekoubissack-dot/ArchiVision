import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ServiceEntrepriseService, ServiceEntreprise, OrganigrammeView } from './service-entreprise.service';

describe('ServiceEntrepriseService', () => {
  let service: ServiceEntrepriseService;
  let httpMock: HttpTestingController;

  const mockService: ServiceEntreprise = {
    id: 'service-001',
    nom: 'Direction des systèmes d\'information',
    description: null,
    organisationId: 'org-001',
    parentId: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ServiceEntrepriseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les services de l\'entreprise', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/services');
    expect(req.request.method).toBe('GET');
    req.flush([mockService]);

    expect(result).toEqual([mockService]);
  });

  it('crée un service', () => {
    let result: unknown;
    service.create({ nom: mockService.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/services');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockService.nom });
    req.flush(mockService);

    expect(result).toEqual(mockService);
  });

  it('met à jour un service', () => {
    let result: unknown;
    service.update(mockService.id, { nom: 'DSI renommée' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/services/${mockService.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockService, nom: 'DSI renommée' });

    expect((result as ServiceEntreprise).nom).toBe('DSI renommée');
  });

  it('supprime un service', () => {
    let completed = false;
    service.delete(mockService.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/services/${mockService.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la vue de l\'organigramme', () => {
    const mockView: OrganigrammeView = {
      membreCount: 3,
      serviceCount: 2,
      svg: '<svg></svg>',
    };
    let result: unknown;
    service.generateView().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/services/generate-vue');
    expect(req.request.method).toBe('GET');
    req.flush(mockView);

    expect(result).toEqual(mockView);
  });
});
