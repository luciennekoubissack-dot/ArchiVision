import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type RoleUtilisateur = 'SUPERADMIN' | 'ADMINISTRATEUR' | 'ARCHITECTE';

export interface CurrentUser {
  id: string;
  email: string;
  nom: string;
  avatarUrl?: string | null;
  role: RoleUtilisateur;
}

export interface UpdateMePayload {
  nom?: string;
  avatarUrl?: string;
}

export interface ObjectifItem {
  nom: string;
  description?: string;
}

export interface PartiePrenanteItem {
  nom: string;
  role?: string;
}

export interface BpmnProcessusItem {
  nom: string;
  description?: string;
}

export interface CapaciteItem {
  nom: string;
  description?: string;
}

export interface ActeurItem {
  nom: string;
  type: 'ACTEUR_METIER' | 'ROLE_METIER';
}

export interface DataEntityItem {
  nom: string;
  description?: string;
}

export interface ApplicationItem {
  nom: string;
  description?: string;
  criticite?: 'HAUTE' | 'MOYENNE' | 'BASSE';
}

export interface TechComponentItem {
  nom: string;
  type: 'SERVEUR' | 'RESEAU' | 'CLOUD' | 'BASE_DE_DONNEES' | 'MIDDLEWARE';
  description?: string;
}

export interface RegisterPayload {
  organisationNom: string;
  organisationDescription?: string;
  secteur?: string;
  taille?: string;
  pays?: string;
  logoUrl?: string;
  vision?: string;
  problemesResoudre?: string;
  email: string;
  password: string;
  nom: string;
  objectifs?: ObjectifItem[];
  partiesPrenantes?: PartiePrenanteItem[];
  bpmnProcessus?: BpmnProcessusItem[];
  capacitesMetier?: CapaciteItem[];
  acteurs?: ActeurItem[];
  dataEntities?: DataEntityItem[];
  applications?: ApplicationItem[];
  techComponents?: TechComponentItem[];
}

interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}

export interface RegisterResponse {
  accessToken: string;
  user: CurrentUser;
  organisation: { id: string; nom: string; statut: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'archivision_token';
  private readonly userKey = 'archivision_user';

  readonly currentUser = signal<CurrentUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/auth/login', { email, password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>('/auth/register', payload)
      .pipe(tap((response) => this.storeSession(response)));
  }

  uploadLogo(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>('/uploads/logo', form);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  hasRole(...roles: RoleUtilisateur[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }

  updateMe(payload: UpdateMePayload): Observable<CurrentUser> {
    return this.http.patch<CurrentUser>('/auth/me', payload).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, response.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
