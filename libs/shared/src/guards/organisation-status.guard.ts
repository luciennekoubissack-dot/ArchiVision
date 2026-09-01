import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@archivision/infrastructure';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_PENDING_ORG_KEY } from '../decorators/allow-pending-organisation.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * Refuse l'accès à toute route tenant tant que l'organisation de
 * l'utilisateur n'est pas VALIDEE. Défense en profondeur : le login bloque
 * déjà l'obtention d'une session, ce guard couvre le cas d'un cookie encore
 * valide dont l'organisation a été rejetée entre-temps.
 *
 * Doit être enregistré en APP_GUARD APRÈS JwtAuthGuard (qui peuple
 * request.user), voir app.module.ts. PrismaService est fourni par le
 * PrismaModule global, donc injectable ici sans import de module.
 */
export const ORGANISATION_NON_VALIDEE = 'ORGANISATION_NON_VALIDEE';

const MESSAGES: Record<string, string> = {
  EN_ATTENTE: "Votre organisation est en attente de validation par l'équipe ArchiVision.",
  REJETEE: "La demande d'inscription de votre organisation n'a pas été retenue.",
};

/**
 * Corps d'erreur commun au login et au guard : même message, même `code`
 * machine (`ORGANISATION_NON_VALIDEE`) exploitable côté frontend.
 */
export function organisationNonValideeError(statut?: string | null) {
  const key = statut ?? 'EN_ATTENTE';
  return {
    message: MESSAGES[key] ?? MESSAGES.EN_ATTENTE,
    error: ORGANISATION_NON_VALIDEE,
    code: ORGANISATION_NON_VALIDEE,
    statut: key,
  };
}

@Injectable()
export class OrganisationStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const allowPending = this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_ORG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowPending) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    // Pas d'utilisateur (route publique non marquée), superadmin (sans
    // organisation) : rien à vérifier ici, d'autres guards s'en chargent.
    if (!user || user.role === 'SUPERADMIN' || !user.organisationId) return true;

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: user.organisationId },
      select: { statut: true },
    });

    if (!organisation || organisation.statut !== 'VALIDEE') {
      throw new ForbiddenException(organisationNonValideeError(organisation?.statut));
    }

    return true;
  }
}
