import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ArchimateService,
  CapaciteMetier,
  ElementArchimate,
  RelationArchimate,
} from './archimate.service';
import { ArchimateLayoutEntity } from '../api-client/models/archimate-layout-entity';

describe('ArchimateService', () => {
  let service: ArchimateService;
  let httpMock: HttpTestingController;

  const mockCapacite: CapaciteMetier = {
    id: 'capacite-001',
    nom: 'Gestion de la relation client',
    description: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockElement: ElementArchimate = {
    id: 'element-001',
    nom: 'Gérer les réclamations clients',
    type: 'PROCESSUS_METIER',
    statut: 'AS_IS',
    description: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockRelation: RelationArchimate = {
    id: 'relation-001',
    type: 'ASSIGNATION',
    sourceId: 'element-001',
    targetId: 'element-002',
    source: { id: 'element-001', nom: 'Gérer les réclamations clients', type: 'PROCESSUS_METIER' },
    target: { id: 'element-002', nom: 'Service client', type: 'ROLE_METIER' },
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArchimateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les capacités métier', () => {
    let result: unknown;
    service.listCapacites().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/capacites-metier');
    expect(req.request.method).toBe('GET');
    req.flush([mockCapacite]);

    expect(result).toEqual([mockCapacite]);
  });

  it('liste les capacités métier paginées', () => {
    let result: unknown;
    service.listCapacitesPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/capacites-metier?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockCapacite], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockCapacite], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une capacité métier', () => {
    let result: unknown;
    service.createCapacite({ nom: mockCapacite.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/capacites-metier');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockCapacite.nom });
    req.flush(mockCapacite);

    expect(result).toEqual(mockCapacite);
  });

  it('met à jour une capacité métier', () => {
    let result: unknown;
    service.updateCapacite(mockCapacite.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/capacites-metier/${mockCapacite.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockCapacite, nom: 'Nouveau nom' });

    expect((result as CapaciteMetier).nom).toBe('Nouveau nom');
  });

  it('supprime une capacité métier', () => {
    let completed = false;
    service.deleteCapacite(mockCapacite.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/capacites-metier/${mockCapacite.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('liste tous les éléments ArchiMate', () => {
    let result: unknown;
    service.listElements().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate');
    expect(req.request.method).toBe('GET');
    req.flush([mockElement]);

    expect(result).toEqual([mockElement]);
  });

  it('liste les éléments ArchiMate paginés', () => {
    let result: unknown;
    service.listElementsPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockElement], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockElement], total: 1, page: 1, pageSize: 20 });
  });

  it('crée un élément ArchiMate', () => {
    let result: unknown;
    service.createElement({ nom: mockElement.nom, type: mockElement.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockElement.nom, type: mockElement.type });
    req.flush(mockElement);

    expect(result).toEqual(mockElement);
  });

  it('met à jour un élément ArchiMate', () => {
    let result: unknown;
    service.updateElement(mockElement.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/elements-archimate/${mockElement.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockElement, nom: 'Nouveau nom' });

    expect((result as ElementArchimate).nom).toBe('Nouveau nom');
  });

  it('supprime un élément ArchiMate', () => {
    let completed = false;
    service.deleteElement(mockElement.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/elements-archimate/${mockElement.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la vue ArchiMate', () => {
    let result: unknown;
    service.generateView().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate/generate-vue');
    expect(req.request.method).toBe('GET');
    req.flush({ elementCount: 5, relationCount: 3, svg: '<svg></svg>' });

    expect(result).toEqual({ elementCount: 5, relationCount: 3, svg: '<svg></svg>' });
  });

  it("met à jour la position d'un élément", () => {
    let result: unknown;
    service.updateElementPosition(mockElement.id, 100, 200).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/elements-archimate/${mockElement.id}/position`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ positionX: 100, positionY: 200 });
    req.flush({ ...mockElement, positionX: 100, positionY: 200 });

    expect((result as ElementArchimate).positionX).toBe(100);
  });

  it('met à jour les positions de plusieurs éléments en lot', () => {
    let result: unknown;
    const items = [{ id: mockElement.id, positionX: 100, positionY: 200 }];
    service.updateElementPositionsBatch(items).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate/positions');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items });
    req.flush([{ ...mockElement, positionX: 100, positionY: 200 }]);

    expect(result).toEqual([{ ...mockElement, positionX: 100, positionY: 200 }]);
  });

  it('génère automatiquement la disposition des éléments', () => {
    let result: unknown;
    service.generateLayout().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/elements-archimate/generate-layout');
    expect(req.request.method).toBe('POST');
    const mockLayout: ArchimateLayoutEntity = { elementCount: 1, elements: [mockElement] };
    req.flush(mockLayout);

    expect(result).toEqual(mockLayout);
  });

  it('liste toutes les relations ArchiMate', () => {
    let result: unknown;
    service.listRelations().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/relations-archimate');
    expect(req.request.method).toBe('GET');
    req.flush([mockRelation]);

    expect(result).toEqual([mockRelation]);
  });

  it('liste les relations ArchiMate paginées', () => {
    let result: unknown;
    service.listRelationsPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/relations-archimate?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockRelation], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockRelation], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une relation ArchiMate', () => {
    let result: unknown;
    service
      .createRelation({ sourceId: 'element-001', targetId: 'element-002', type: 'ASSIGNATION' })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/relations-archimate');
    expect(req.request.method).toBe('POST');
    req.flush(mockRelation);

    expect(result).toEqual(mockRelation);
  });

  it('supprime une relation ArchiMate', () => {
    let completed = false;
    service.deleteRelation(mockRelation.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/relations-archimate/${mockRelation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
