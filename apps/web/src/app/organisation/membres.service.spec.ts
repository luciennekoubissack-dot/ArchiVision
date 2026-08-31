import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MembresService, Membre } from './membres.service';

describe('MembresService', () => {
  let service: MembresService;
  let httpMock: HttpTestingController;

  const mockMembre: Membre = {
    id: 'membre-001',
    nom: 'Jeanne Dupont',
    email: 'jeanne.dupont@archivision.fr',
    contact: null,
    poste: 'Architecte',
    role: 'ARCHITECTE',
    serviceId: null,
    createdAt: '2026-07-01T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MembresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les membres', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/membres');
    expect(req.request.method).toBe('GET');
    req.flush([mockMembre]);

    expect(result).toEqual([mockMembre]);
  });

  it('liste les membres paginés', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/membres?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockMembre], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockMembre], total: 1, page: 1, pageSize: 20 });
  });

  it('crée un membre', () => {
    let result: unknown;
    service
      .create({
        nom: mockMembre.nom,
        email: mockMembre.email,
        password: 'motdepasse123',
        role: mockMembre.role,
      })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/membres');
    expect(req.request.method).toBe('POST');
    req.flush(mockMembre);

    expect(result).toEqual(mockMembre);
  });

  it('met à jour un membre', () => {
    let result: unknown;
    service.update(mockMembre.id, { poste: 'Architecte senior' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/membres/${mockMembre.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockMembre, poste: 'Architecte senior' });

    expect((result as Membre).poste).toBe('Architecte senior');
  });

  it('supprime un membre', () => {
    let completed = false;
    service.delete(mockMembre.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/membres/${mockMembre.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
