import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ApiConfiguration } from '../api-client/api-configuration';
import { AuthUserEntity } from '../api-client/models/auth-user-entity';
import { AuthResponseEntity } from '../api-client/models/auth-response-entity';
import { RegisterResponseEntity } from '../api-client/models/register-response-entity';
import { RegisterDto } from '../api-client/models/register-dto';
import { UpdateMeDto } from '../api-client/models/update-me-dto';
import { UploadLogoResultEntity } from '../api-client/models/upload-logo-result-entity';
import { authControllerLogin } from '../api-client/fn/auth/auth-controller-login';
import { authControllerRegister } from '../api-client/fn/auth/auth-controller-register';
import { authControllerLogout } from '../api-client/fn/auth/auth-controller-logout';
import { authControllerMe } from '../api-client/fn/auth/auth-controller-me';
import { authControllerUpdateMe } from '../api-client/fn/auth/auth-controller-update-me';
import { uploadsControllerUploadLogo } from '../api-client/fn/uploads/uploads-controller-upload-logo';
import { uploadsControllerUploadAvatar } from '../api-client/fn/uploads/uploads-controller-upload-avatar';
import { AcceptInvitationDto } from '../api-client/models/accept-invitation-dto';
import { InvitationPublicEntity } from '../api-client/models/invitation-public-entity';
import { invitationPublicControllerFindByToken } from '../api-client/fn/invitations/invitation-public-controller-find-by-token';
import { invitationPublicControllerAccept } from '../api-client/fn/invitations/invitation-public-controller-accept';
import { ForgotPasswordDto } from '../api-client/models/forgot-password-dto';
import { ResetPasswordDto } from '../api-client/models/reset-password-dto';
import { MessageResponseEntity } from '../api-client/models/message-response-entity';
import { authControllerForgotPassword } from '../api-client/fn/auth/auth-controller-forgot-password';
import { authControllerResetPassword } from '../api-client/fn/auth/auth-controller-reset-password';

export type RoleUtilisateur = AuthUserEntity['role'];
export type CurrentUser = AuthUserEntity;
export type UpdateMePayload = UpdateMeDto;
export type RegisterPayload = RegisterDto;
export type RegisterResponse = RegisterResponseEntity;
export type InvitationDetails = InvitationPublicEntity;
export type AcceptInvitationPayload = AcceptInvitationDto;
export type ResetPasswordPayload = ResetPasswordDto;

export type ObjectifItem = NonNullable<RegisterDto['objectifs']>[number];
export type PartiePrenanteItem = NonNullable<RegisterDto['partiesPrenantes']>[number];
export type BpmnProcessusItem = NonNullable<RegisterDto['bpmnProcessus']>[number];
export type CapaciteItem = NonNullable<RegisterDto['capacitesMetier']>[number];
export type ActeurItem = NonNullable<RegisterDto['acteurs']>[number];
export type DataEntityItem = NonNullable<RegisterDto['dataEntities']>[number];
export type ApplicationItem = NonNullable<RegisterDto['applications']>[number];
export type TechComponentItem = NonNullable<RegisterDto['techComponents']>[number];

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Le token d'accès n'est plus stocké ici : le backend le pose en cookie
  // httpOnly (voir auth.controller.ts côté API), donc invisible et involable
  // par du JS injecté (XSS). Seules les infos d'affichage non sensibles
  // (nom, email, rôle) restent en localStorage pour éviter un aller-retour
  // réseau à chaque rechargement de page.
  private readonly userKey = 'archivision_user';

  readonly currentUser = signal<CurrentUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  login(email: string, password: string): Observable<AuthResponseEntity> {
    return authControllerLogin(this.http, this.config.rootUrl, { body: { email, password } }).pipe(
      map((r) => r.body),
      tap((response) => this.storeSession(response)),
    );
  }

  /**
   * Inscription : n'ouvre aucune session. L'organisation démarre EN_ATTENTE et
   * ne pourra se connecter qu'après validation par le superadmin (lien de
   * connexion envoyé par e-mail).
   */
  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return authControllerRegister(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  /** Détails d'une invitation à partir du jeton reçu par e-mail (page « Rejoindre »). */
  invitationDetails(token: string): Observable<InvitationDetails> {
    return invitationPublicControllerFindByToken(this.http, this.config.rootUrl, { token }).pipe(map((r) => r.body));
  }

  /**
   * Accepte une invitation : crée le compte du membre et ouvre sa session
   * (mêmes cookies qu'une connexion classique).
   */
  acceptInvitation(payload: AcceptInvitationPayload): Observable<AuthResponseEntity> {
    return invitationPublicControllerAccept(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
      tap((response) => this.storeSession(response)),
    );
  }

  /**
   * Demande un e-mail de réinitialisation de mot de passe. Répond toujours
   * avec le même message, que le compte existe ou non (voir auth.service.ts
   * côté API) : le composant appelant n'a rien de spécifique à distinguer.
   */
  forgotPassword(email: string): Observable<MessageResponseEntity> {
    const body: ForgotPasswordDto = { email };
    return authControllerForgotPassword(this.http, this.config.rootUrl, { body }).pipe(map((r) => r.body));
  }

  /** Réinitialise le mot de passe à partir du jeton reçu par e-mail et ouvre la session. */
  resetPassword(payload: ResetPasswordPayload): Observable<AuthResponseEntity> {
    return authControllerResetPassword(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
      tap((response) => this.storeSession(response)),
    );
  }

  uploadLogo(file: File): Observable<UploadLogoResultEntity> {
    return uploadsControllerUploadLogo(this.http, this.config.rootUrl, { body: { file } }).pipe(map((r) => r.body));
  }

  /** Téléverse la photo de profil de l'utilisateur courant et renvoie son chemin `/uploads/...`. */
  uploadAvatar(file: File): Observable<UploadLogoResultEntity> {
    return uploadsControllerUploadAvatar(this.http, this.config.rootUrl, { body: { file } }).pipe(map((r) => r.body));
  }

  logout(): void {
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    authControllerLogout(this.http, this.config.rootUrl).subscribe({ error: () => {} });
  }

  hasRole(...roles: RoleUtilisateur[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }

  /**
   * Revalide la session auprès du serveur (utilisé au démarrage de l'app
   * quand un utilisateur est déjà en mémoire via localStorage, pour détecter
   * une session expirée ou un compte désactivé côté serveur sans attendre le
   * prochain appel API qui échouerait). Se déconnecte localement sur 401 ;
   * les autres erreurs (réseau, etc.) sont ignorées pour ne pas déconnecter
   * l'utilisateur à cause d'un problème transitoire.
   */
  refreshMe(): void {
    if (!this.isAuthenticated()) return;
    authControllerMe(this.http, this.config.rootUrl)
      .pipe(map((r) => r.body))
      .subscribe({
        next: (user) => {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUser.set(user);
        },
        error: (err) => {
          if (err?.status === 401) this.logout();
        },
      });
  }

  updateMe(payload: UpdateMePayload): Observable<CurrentUser> {
    return authControllerUpdateMe(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  private storeSession(response: { user: CurrentUser }): void {
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
