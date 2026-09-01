import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TechnologieService, TechComponent } from './technologie.service';
import { TechDeploiementEntity } from '../api-client/models/tech-deploiement-entity';

describe('TechnologieService', () => {
  let service: TechnologieService;
  let httpMock: HttpTestingController;

  const mockTechComponent: TechComponent = {
    id: 'tech-001',
    nom: 'Serveur applicatif',
    description: null,
    type: 'SERVEUR',
    statut: 'AS_IS',
    positionX: 100,
    positionY: 200,
    organisationId: 'org-001',
    deploiements: [],
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TechnologieService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les composants technologiques', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/tech-components');
    expect(req.request.method).toBe('GET');
    req.flush([mockTechComponent]);

    expect(result).toEqual([mockTechComponent]);
  });

  it('liste les composants technologiques paginés', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/tech-components?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockTechComponent], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockTechComponent], total: 1, page: 1, pageSize: 20 });
  });

  it('crée un composant technologique', () => {
    let result: unknown;
    service.create({ nom: mockTechComponent.nom, type: mockTechComponent.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/tech-components');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockTechComponent.nom, type: mockTechComponent.type });
    req.flush(mockTechComponent);

    expect(result).toEqual(mockTechComponent);
  });

  it('met à jour un composant technologique', () => {
    let result: unknown;
    service.update(mockTechComponent.id, { statut: 'TO_BE' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/tech-components/${mockTechComponent.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockTechComponent, statut: 'TO_BE' });

    expect((result as TechComponent).statut).toBe('TO_BE');
  });

  it('supprime un composant technologique', () => {
    let completed = false;
    service.delete(mockTechComponent.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/tech-components/${mockTechComponent.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('déploie une application sur un composant technologique', () => {
    const mockDeploiement: TechDeploiementEntity = {
      applicationId: 'app-001',
      techComponentId: mockTechComponent.id,
    };
    let result: unknown;
    service
      .deployer({ applicationId: mockDeploiement.applicationId, techComponentId: mockDeploiement.techComponentId })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/tech-components/deployer');
    expect(req.request.method).toBe('POST');
    req.flush(mockDeploiement);

    expect(result).toEqual(mockDeploiement);
  });

  it('retire le déploiement d\'une application sur un composant technologique', () => {
    let completed = false;
    service.undeployer(mockTechComponent.id, 'app-001').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/tech-components/${mockTechComponent.id}/applications/app-001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la disposition automatique du diagramme de déploiement', () => {
    let result: unknown;
    service.generateLayout().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/tech-components/generate-layout');
    expect(req.request.method).toBe('POST');
    req.flush({ elements: [], count: 0 });

    expect(result).toEqual({ elements: [], count: 0 });
  });
});
