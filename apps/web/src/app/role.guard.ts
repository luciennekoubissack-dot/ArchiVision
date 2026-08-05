import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService, RoleUtilisateur } from './auth.service';

/** Restreint une route aux rôles listés dans `route.data['roles']`. */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data['roles'] as RoleUtilisateur[] | undefined;
    if (!allowedRoles || allowedRoles.length === 0 || this.auth.hasRole(...allowedRoles)) {
      return true;
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}
