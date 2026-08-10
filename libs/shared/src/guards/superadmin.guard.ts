import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SUPERADMIN_ROUTE_KEY } from '../decorators/superadmin-route.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Empêche toute fuite cross-tenant entre le rôle SUPERADMIN (sans
 * organisationId) et les routes tenant : un SUPERADMIN ne peut atteindre que
 * les routes @SuperAdminRoute(), et inversement seul un SUPERADMIN peut les
 * atteindre. Doit être enregistré en APP_GUARD APRÈS JwtAuthGuard (qui
 * peuple request.user) — voir app.module.ts.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user) return true;

    const isSuperAdminRoute = this.reflector.getAllAndOverride<boolean>(SUPERADMIN_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (user.role === 'SUPERADMIN' && !isSuperAdminRoute) {
      throw new ForbiddenException('Réservé aux comptes entreprise');
    }
    if (user.role !== 'SUPERADMIN' && isSuperAdminRoute) {
      throw new ForbiddenException('Réservé au superadministrateur');
    }

    return true;
  }
}
