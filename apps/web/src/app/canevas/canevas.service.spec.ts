import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CanevasService, CanevasRelation } from './canevas.service';

describe('CanevasService', () => {
  let service: CanevasService;
  let httpMock: HttpTestingController;

  const mockRelation: CanevasRelation = {
    id: 'relation-001',
    organisationId: 'org-001',
    sourceId: 'app-001',
    sourceKind: 'APPLICATION',
    targetId: 'tech-001',
    targetKind: 'TECH_COMPONENT',
    type: 'ASSOCIATION',
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CanevasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste les relations du canevas', () => {
    let result: unknown;
    service.listRelations().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/canevas-relations');
    expect(req.request.method).toBe('GET');
    req.flush([mockRelation]);

    expect(result).toEqual([mockRelation]);
  });

  it('crée une relation du canevas', () => {
    let result: unknown;
    service
      .createRelation({
        sourceId: mockRelation.sourceId,
        sourceKind: mockRelation.sourceKind,
        targetId: mockRelation.targetId,
        targetKind: mockRelation.targetKind,
        type: mockRelation.type,
      })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/canevas-relations');
    expect(req.request.method).toBe('POST');
    req.flush(mockRelation);

    expect(result).toEqual(mockRelation);
  });

  it('supprime une relation du canevas', () => {
    let completed = false;
    service.deleteRelation(mockRelation.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/canevas-relations/${mockRelation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
