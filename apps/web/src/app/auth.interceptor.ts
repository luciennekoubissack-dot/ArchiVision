import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const token = this.auth.getToken();
    const authorizedRequest = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authorizedRequest).pipe(
      catchError((error: unknown) => {
        // Un 401 sur une requête déjà authentifiée signifie un token expiré/invalide.
        // Un 401 sur /auth/login (pas de token envoyé) est un échec de connexion normal,
        // à laisser remonter tel quel pour que le formulaire l'affiche.
        if (token && error instanceof HttpErrorResponse && error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      }),
    );
  }
}
