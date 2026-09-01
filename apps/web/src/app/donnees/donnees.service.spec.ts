import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DonneesService, DataEntity, DataAttribute, DataRelation } from './donnees.service';
import { DataRelationEntity } from '../api-client/models/data-relation-entity';

describe('DonneesService', () => {
  let service: DonneesService;
  let httpMock: HttpTestingController;

  const mockEntity: DataEntity = {
    id: 'entite-001',
    nom: 'Client',
    attributs: [],
    statut: 'AS_IS',
    description: null,
    proprietaire: null,
    organisationId: 'org-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockAttribute: DataAttribute = {
    id: 'attribut-001',
    entityId: 'entite-001',
    nom: 'email',
    type: 'string',
  };

  const mockRelation: DataRelation = {
    id: 'relation-001',
    cardinalite: 'UN_A_PLUSIEURS',
    label: null,
    sourceId: 'entite-001',
    targetId: 'entite-002',
    source: { ...mockEntity },
    target: { ...mockEntity, id: 'entite-002', nom: 'Commande' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DonneesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les entités de données', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities');
    expect(req.request.method).toBe('GET');
    req.flush([mockEntity]);

    expect(result).toEqual([mockEntity]);
  });

  it('liste les entités de données paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockEntity], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockEntity], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une entité de données', () => {
    let result: unknown;
    service.create({ nom: mockEntity.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockEntity.nom });
    req.flush(mockEntity);

    expect(result).toEqual(mockEntity);
  });

  it('met à jour une entité de données', () => {
    let result: unknown;
    service.update(mockEntity.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/data-entities/${mockEntity.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockEntity, nom: 'Nouveau nom' });

    expect((result as DataEntity).nom).toBe('Nouveau nom');
  });

  it('supprime une entité de données', () => {
    let completed = false;
    service.delete(mockEntity.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/data-entities/${mockEntity.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('ajoute un attribut à une entité de données', () => {
    let result: unknown;
    service.addAttribute(mockEntity.id, { nom: mockAttribute.nom, type: mockAttribute.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/data-entities/${mockEntity.id}/attributs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockAttribute.nom, type: mockAttribute.type });
    req.flush(mockAttribute);

    expect(result).toEqual(mockAttribute);
  });

  it('supprime un attribut', () => {
    let completed = false;
    service.removeAttribute(mockAttribute.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/data-entities/attributs/${mockAttribute.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('liste toutes les relations entre entités de données', () => {
    let result: unknown;
    service.listRelations().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities/relations');
    expect(req.request.method).toBe('GET');
    req.flush([mockRelation]);

    expect(result).toEqual([mockRelation]);
  });

  it('liste les relations entre entités de données paginées', () => {
    let result: unknown;
    service.listRelationsPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities/relations?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockRelation], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockRelation], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une relation entre entités de données', () => {
    let result: unknown;
    const mockRelationEntity: DataRelationEntity = {
      id: 'relation-001',
      cardinalite: 'UN_A_PLUSIEURS',
      label: null,
      sourceId: 'entite-001',
      targetId: 'entite-002',
    };
    service
      .createRelation({ sourceId: 'entite-001', targetId: 'entite-002', cardinalite: 'UN_A_PLUSIEURS' })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities/relations');
    expect(req.request.method).toBe('POST');
    req.flush(mockRelationEntity);

    expect(result).toEqual(mockRelationEntity);
  });

  it('supprime une relation entre entités de données', () => {
    let completed = false;
    service.removeRelation(mockRelation.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/data-entities/relations/${mockRelation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('génère la disposition automatique du diagramme de classe', () => {
    let result: unknown;
    service.generateLayout().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/data-entities/generate-layout');
    expect(req.request.method).toBe('POST');
    const body = { elements: [], count: 0, relationsInfereesCount: 2 };
    req.flush(body);

    expect(result).toEqual(body);
  });
});
