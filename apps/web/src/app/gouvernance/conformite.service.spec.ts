import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConformiteService, ConformiteSolution } from './conformite.service';
import { ConformiteEntity } from '../api-client/models/conformite-entity';

describe('ConformiteService', () => {
  let service: ConformiteService;
  let httpMock: HttpTestingController;

  const mockConformite: ConformiteEntity = {
    id: 'conformite-001',
    statut: 'CONFORME',
    commentaire: null,
    politiqueId: 'politique-001',
    politique: { id: 'politique-001', nom: 'Politique de sécurité des données' },
    solutionId: 'solution-001',
    solution: { id: 'solution-001', nom: 'CRM Cloud' },
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockConformiteBySolution: ConformiteSolution = {
    id: 'conformite-001',
    statut: 'CONFORME',
    commentaire: null,
    politiqueId: 'politique-001',
    politique: { id: 'politique-001', nom: 'Politique de sécurité des données' },
    solutionId: 'solution-001',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConformiteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste toutes les conformités', () => {
    let result: unknown;
    service.listAll().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/conformites-solutions');
    expect(req.request.method).toBe('GET');
    req.flush([mockConformite]);

    expect(result).toEqual([mockConformite]);
  });

  it('met à jour les conformités d\'une solution', () => {
    let result: unknown;
    const items = [{ politiqueId: 'politique-001', statut: 'CONFORME' as const }];
    service.updateConformites('solution-001', items).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/conformites-solutions/solution-001');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items });
    req.flush([mockConformiteBySolution]);

    expect(result).toEqual([mockConformiteBySolution]);
  });
});
