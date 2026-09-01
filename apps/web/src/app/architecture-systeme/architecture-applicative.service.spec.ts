import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ArchitectureApplicativeService,
  ArchiApplicativeElement,
  ArchiApplicativeFlux,
} from './architecture-applicative.service';

describe('ArchitectureApplicativeService', () => {
  let service: ArchitectureApplicativeService;
  let httpMock: HttpTestingController;

  const mockElement: ArchiApplicativeElement = {
    id: 'element-001',
    nom: 'Portail client',
    type: 'APPLICATION',
    description: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockFlux: ArchiApplicativeFlux = {
    id: 'flux-001',
    sourceId: 'element-001',
    targetId: 'element-002',
    type: 'API',
    label: null,
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArchitectureApplicativeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("liste tous les éléments d'architecture applicative", () => {
    let result: unknown;
    service.listElements().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/elements');
    expect(req.request.method).toBe('GET');
    req.flush([mockElement]);

    expect(result).toEqual([mockElement]);
  });

  it("crée un élément d'architecture applicative", () => {
    let result: unknown;
    service.createElement({ nom: mockElement.nom, type: mockElement.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/elements');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockElement.nom, type: mockElement.type });
    req.flush(mockElement);

    expect(result).toEqual(mockElement);
  });

  it("met à jour un élément d'architecture applicative", () => {
    let result: unknown;
    service.updateElement(mockElement.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/architecture-applicative/elements/${mockElement.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockElement, nom: 'Nouveau nom' });

    expect((result as ArchiApplicativeElement).nom).toBe('Nouveau nom');
  });

  it("supprime un élément d'architecture applicative", () => {
    let completed = false;
    service.deleteElement(mockElement.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/architecture-applicative/elements/${mockElement.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('liste tous les flux', () => {
    let result: unknown;
    service.listFlux().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/flux');
    expect(req.request.method).toBe('GET');
    req.flush([mockFlux]);

    expect(result).toEqual([mockFlux]);
  });

  it('crée un flux', () => {
    let result: unknown;
    service.createFlux({ sourceId: mockFlux.sourceId, targetId: mockFlux.targetId }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/flux');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sourceId: mockFlux.sourceId, targetId: mockFlux.targetId });
    req.flush(mockFlux);

    expect(result).toEqual(mockFlux);
  });

  it('supprime un flux', () => {
    let completed = false;
    service.deleteFlux(mockFlux.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/architecture-applicative/flux/${mockFlux.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it("génère la vue d'architecture applicative", () => {
    let result: unknown;
    service.generateView().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/generate-vue');
    expect(req.request.method).toBe('GET');
    req.flush({ elementCount: 4, fluxCount: 2, svg: '<svg></svg>' });

    expect(result).toEqual({ elementCount: 4, fluxCount: 2, svg: '<svg></svg>' });
  });

  it("génère la disposition automatique du diagramme d'architecture applicative", () => {
    let result: unknown;
    service.generateLayout().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/architecture-applicative/generate-layout');
    expect(req.request.method).toBe('POST');
    req.flush({ elements: [], count: 0 });

    expect(result).toEqual({ elements: [], count: 0 });
  });
});
