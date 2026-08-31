import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, CurrentUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: CurrentUser = {
    id: 'user-001',
    email: 'architecte@archivision.test',
    nom: 'Ada Lovelace',
    role: 'ARCHITECTE',
    avatarUrl: null,
  };

  const mockAdmin: CurrentUser = {
    id: 'user-002',
    email: 'admin@archivision.test',
    nom: 'Grace Hopper',
    role: 'ADMINISTRATEUR',
    avatarUrl: null,
  };

  /** Connecte le service via login() + flush, pour partir d'un état authentifié connu. */
  function loginAs(user: CurrentUser): void {
    service.login(user.email, 'motdepasse').subscribe();
    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ accessToken: 'jwt-fake', user });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login stocke la session dans localStorage et met à jour le signal currentUser', () => {
    let result: unknown;
    service.login(mockUser.email, 'motdepasse').subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: mockUser.email, password: 'motdepasse' });
    req.flush({ accessToken: 'jwt-fake', user: mockUser });

    expect(result).toEqual({ accessToken: 'jwt-fake', user: mockUser });
    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(JSON.parse(localStorage.getItem('archivision_user')!)).toEqual(mockUser);
  });

  it('register stocke la session dans localStorage et met à jour le signal currentUser', () => {
    let result: unknown;
    const registerPayload = { email: mockUser.email, password: 'motdepasse', nom: mockUser.nom, organisationNom: 'Acme' };
    service.register(registerPayload as any).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    const mockRegisterResponse = {
      accessToken: 'jwt-fake',
      organisation: { id: 'org-001', nom: 'Acme' },
      user: mockUser,
    };
    req.flush(mockRegisterResponse);

    expect(result).toEqual(mockRegisterResponse);
    expect(service.currentUser()).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('archivision_user')!)).toEqual(mockUser);
  });

  it('logout vide localStorage et remet currentUser à null immédiatement, sans attendre la réponse HTTP', () => {
    loginAs(mockUser);
    expect(service.currentUser()).toEqual(mockUser);

    service.logout();

    // L'état local est nettoyé de façon synchrone (fire-and-forget), avant même
    // que la requête HTTP sous-jacente n'ait été flush.
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('archivision_user')).toBeNull();

    const req = httpMock.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    // Le composant ignore explicitement les erreurs sur ce endpoint (error: () => {}) :
    // on vérifie qu'une erreur ne casse rien côté service.
    req.flush({ message: 'erreur serveur' }, { status: 500, statusText: 'Internal Server Error' });

    expect(service.currentUser()).toBeNull();
  });

  it('hasRole reflète le rôle de l\'utilisateur courant après connexion', () => {
    expect(service.hasRole('ADMINISTRATEUR', 'ARCHITECTE')).toBe(false);

    loginAs(mockAdmin);

    expect(service.hasRole('ADMINISTRATEUR')).toBe(true);
    expect(service.hasRole('ARCHITECTE')).toBe(false);
    expect(service.hasRole('ARCHITECTE', 'ADMINISTRATEUR')).toBe(true);
  });

  it('hasRole renvoie false quand aucun utilisateur n\'est connecté', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.hasRole('SUPERADMIN', 'ADMINISTRATEUR', 'ARCHITECTE')).toBe(false);
  });

  it('refreshMe ne déclenche aucun appel HTTP si l\'utilisateur n\'est pas authentifié', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.refreshMe();

    httpMock.expectNone('/api/v1/auth/me');
  });

  it('refreshMe met à jour localStorage et currentUser en cas de succès', () => {
    loginAs(mockUser);

    const updatedUser: CurrentUser = { ...mockUser, nom: 'Ada Lovelace (mise à jour)' };
    service.refreshMe();

    const req = httpMock.expectOne('/api/v1/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush(updatedUser);

    expect(service.currentUser()).toEqual(updatedUser);
    expect(JSON.parse(localStorage.getItem('archivision_user')!)).toEqual(updatedUser);
  });

  it('refreshMe déconnecte l\'utilisateur (logout implicite) si le serveur répond 401', () => {
    loginAs(mockUser);

    service.refreshMe();

    const req = httpMock.expectOne('/api/v1/auth/me');
    req.flush({ message: 'Session expirée' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('archivision_user')).toBeNull();

    // Le 401 déclenche logout(), qui émet lui-même une requête (fire-and-forget)
    // vers /api/v1/auth/logout : on la flush pour garder httpMock.verify() propre.
    const logoutReq = httpMock.expectOne('/api/v1/auth/logout');
    logoutReq.flush(null);
  });

  it('refreshMe conserve la session en cas d\'erreur serveur (500) autre que 401', () => {
    loginAs(mockUser);

    service.refreshMe();

    const req = httpMock.expectOne('/api/v1/auth/me');
    req.flush({ message: 'Erreur interne' }, { status: 500, statusText: 'Internal Server Error' });

    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(JSON.parse(localStorage.getItem('archivision_user')!)).toEqual(mockUser);
  });

  it('refreshMe conserve la session en cas d\'erreur réseau (statut 0)', () => {
    loginAs(mockUser);

    service.refreshMe();

    const req = httpMock.expectOne('/api/v1/auth/me');
    req.error(new ProgressEvent('network error'), { status: 0, statusText: 'Unknown Error' });

    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('updateMe met à jour localStorage et currentUser après succès', () => {
    loginAs(mockUser);

    let result: unknown;
    const updatedUser: CurrentUser = { ...mockUser, nom: 'Ada L.' };
    service.updateMe({ nom: 'Ada L.' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/auth/me');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nom: 'Ada L.' });
    req.flush(updatedUser);

    expect(result).toEqual(updatedUser);
    expect(service.currentUser()).toEqual(updatedUser);
    expect(JSON.parse(localStorage.getItem('archivision_user')!)).toEqual(updatedUser);
  });

  it('uploadLogo envoie le fichier en multipart et renvoie l\'URL du logo', () => {
    let result: unknown;
    const file = new File(['contenu'], 'logo.png', { type: 'image/png' });
    service.uploadLogo(file).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/uploads/logo');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ url: '/uploads/logo-001.png' });

    expect(result).toEqual({ url: '/uploads/logo-001.png' });
  });
});
