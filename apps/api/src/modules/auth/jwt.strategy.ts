import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RoleUtilisateur } from '@prisma/client';
import { ACCESS_TOKEN_COOKIE_NAME, AuthUser, requireJwtSecret } from '@archivision/shared';

/**
 * Le navigateur (frontend Angular) s'authentifie via le cookie httpOnly posé
 * à la connexion (voir auth-cookies.ts) : le token n'est jamais exposé au JS
 * de la page, donc pas volable par XSS. L'en-tête Authorization reste
 * accepté en complément pour les clients qui ne sont pas un navigateur
 * (scripts, tests, futur client mobile) où ce risque ne s'applique pas.
 */
function cookieExtractor(req: Request): string | null {
  return req.cookies?.[ACCESS_TOKEN_COOKIE_NAME] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(config),
    });
  }

  validate(payload: {
    sub: string;
    email: string;
    organisationId: string | null;
    role: RoleUtilisateur;
  }): AuthUser {
    return {
      sub: payload.sub,
      email: payload.email,
      organisationId: payload.organisationId,
      role: payload.role,
    };
  }
}
