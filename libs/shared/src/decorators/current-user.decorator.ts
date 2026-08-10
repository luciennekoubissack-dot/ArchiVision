import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RoleUtilisateur } from '@prisma/client';

export interface AuthUser {
  sub: string;
  email: string;
  /** `null` uniquement pour le rôle SUPERADMIN, qui n'est rattaché à aucune organisation. */
  organisationId: string | null;
  role: RoleUtilisateur;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
