import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/// Le token de session vit dans un cookie httpOnly posé par l'API (voir
/// auth.controller.ts) : il n'est plus lu/attaché ici, mais le navigateur a
/// besoin de `withCredentials` pour envoyer ce cookie sur chaque requête.
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const credentialedRequest = req.clone({ withCredentials: true });
    const isAuthRoute = AUTH_ROUTES.some((route) => req.url.includes(route));

    return next.handle(credentialedRequest).pipe(
      catchError((error: unknown) => {
        // Un 401 sur /auth/login ou /auth/register est un échec de connexion/
        // inscription normal, à laisser remonter tel quel pour le formulaire.
        // Un 401 ailleurs signifie une session expirée ou absente.
        if (!isAuthRoute && error instanceof HttpErrorResponse && error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      }),
    );
  }
}
