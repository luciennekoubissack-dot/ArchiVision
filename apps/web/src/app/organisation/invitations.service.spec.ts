import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvitationsService, Invitation } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let httpMock: HttpTestingController;

  const mockInvitation: Invitation = {
    id: 'inv-001',
    email: 'nouvelle.recrue@archivision.fr',
    role: 'ARCHITECTE',
    statut: 'EN_ATTENTE',
    serviceId: null,
    poste: null,
    contact: null,
    invitedByNom: 'Admin K&B',
    expiresAt: '2026-09-09T10:00:00.000Z',
    createdAt: '2026-09-02T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvitationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste les invitations paginées', () => {
    let result: unknown;
    service.listPaginated(1, 20).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/invitations?page=1&pageSize=20');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [mockInvitation], total: 1, page: 1, pageSize: 20 });

    expect(result).toEqual({ items: [mockInvitation], total: 1, page: 1, pageSize: 20 });
  });

  it('crée une invitation', () => {
    let result: unknown;
    service.create({ email: mockInvitation.email, role: 'ARCHITECTE' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/invitations');
    expect(req.request.method).toBe('POST');
    req.flush(mockInvitation);

    expect(result).toEqual(mockInvitation);
  });

  it('renvoie une invitation', () => {
    let result: unknown;
    service.resend(mockInvitation.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/invitations/${mockInvitation.id}/renvoyer`);
    expect(req.request.method).toBe('POST');
    req.flush(mockInvitation);

    expect(result).toEqual(mockInvitation);
  });

  it('révoque une invitation', () => {
    let completed = false;
    service.revoke(mockInvitation.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/invitations/${mockInvitation.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
