import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Empêche un utilisateur déjà connecté d'accéder à /login ou /register. */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) {
      const isSuperAdmin = this.auth.hasRole('SUPERADMIN');
      this.router.navigate([isSuperAdmin ? '/admin' : '/dashboard']);
      return false;
    }
    return true;
  }
}
