import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RoleUtilisateur } from '@prisma/client';
import { AuthUser } from '@archivision/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'secretKey',
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
