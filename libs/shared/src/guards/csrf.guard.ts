import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';

/**
 * Protection CSRF en double soumission : l'authentification est passée en
 * cookie httpOnly (voir jwt.strategy.ts), donc le navigateur envoie ce
 * cookie automatiquement sur toute requête vers l'API, y compris celles
 * déclenchées par un site tiers. Angular lit le cookie non-httpOnly
 * `XSRF-TOKEN` (posé à la connexion) et le renvoie dans l'en-tête
 * `X-XSRF-TOKEN` sur chaque requête (support natif de HttpClient via
 * withXsrfConfiguration()) : un site tiers ne peut pas lire ce cookie pour
 * reproduire l'en-tête, donc une requête qui n'a pas les deux valeurs
 * identiques n'est pas partie d'une session légitime.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    // Un client qui s'authentifie par en-tête Bearer explicite (script, futur
    // client mobile...) attache lui-même son identifiant à chaque requête :
    // un site tiers ne peut pas le forcer à le faire, donc le CSRF ne le
    // concerne pas. Seule une requête authentifiée par le cookie posé à la
    // connexion (envoyé automatiquement par le navigateur, y compris pour un
    // site tiers) a besoin de cette vérification.
    const hasBearerAuth = typeof request.headers.authorization === 'string' && request.headers.authorization.startsWith('Bearer ');
    if (hasBearerAuth) return true;

    const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = request.headers[CSRF_HEADER_NAME];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Jeton CSRF manquant ou invalide');
    }

    return true;
  }
}
