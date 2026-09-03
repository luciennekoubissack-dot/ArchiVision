import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany, requireFrontendOrigin } from '@archivision/shared';
import { RoleUtilisateur, StatutInvitation } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationEntity } from './entities/invitation.entity';

/** Durée de validité d'un lien d'invitation. */
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/** Champs exposés à l'ADMINISTRATEUR : le `tokenHash` est volontairement absent. */
const invitationSelect = {
  id: true,
  email: true,
  role: true,
  statut: true,
  serviceId: true,
  poste: true,
  contact: true,
  expiresAt: true,
  createdAt: true,
  invitedBy: { select: { nom: true } },
} as const;

interface InvitationRow {
  id: string;
  email: string;
  role: RoleUtilisateur;
  statut: StatutInvitation;
  serviceId: string | null;
  poste: string | null;
  contact: string | null;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { nom: string } | null;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  /** Invitations encore en attente pour l'organisation, les plus récentes d'abord. */
  async list(organisationId: string, pagination?: PaginationQueryDto) {
    const result = await paginateFindMany(
      this.prisma.invitation,
      {
        where: { organisationId, statut: StatutInvitation.EN_ATTENTE },
        select: invitationSelect,
        orderBy: { createdAt: 'desc' },
      },
      pagination,
    );

    if (Array.isArray(result)) {
      return (result as unknown as InvitationRow[]).map((r) => this.toEntity(r));
    }
    return {
      ...result,
      items: (result.items as unknown as InvitationRow[]).map((r) => this.toEntity(r)),
    };
  }

  async create(organisationId: string, inviterUserId: string, dto: CreateInvitationDto): Promise<InvitationEntity> {
    const email = dto.email.trim().toLowerCase();

    const compteExistant = await this.prisma.user.findUnique({ where: { email } });
    if (compteExistant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const invitationEnCours = await this.prisma.invitation.findFirst({
      where: { organisationId, email, statut: StatutInvitation.EN_ATTENTE },
    });
    if (invitationEnCours) {
      throw new ConflictException('Une invitation est déjà en attente pour cet email');
    }

    if (dto.serviceId) {
      await this.assertServiceInOrganisation(dto.serviceId, organisationId);
    }

    const token = randomBytes(32).toString('base64url');
    const invitation = await this.prisma.invitation.create({
      data: {
        email,
        role: dto.role as RoleUtilisateur,
        organisationId,
        invitedById: inviterUserId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + EXPIRY_MS),
        ...(dto.serviceId && { serviceId: dto.serviceId }),
        ...(dto.poste !== undefined && { poste: dto.poste }),
        ...(dto.contact !== undefined && { contact: dto.contact }),
      },
      select: invitationSelect,
    });

    await this.envoyerEmail(email, organisationId, inviterUserId, token);

    return this.toEntity(invitation as InvitationRow);
  }

  /** Régénère le jeton, repousse l'expiration et renvoie l'e-mail. */
  async resend(organisationId: string, id: string): Promise<InvitationEntity> {
    const existante = await this.assertInvitationEnAttente(organisationId, id);

    const token = randomBytes(32).toString('base64url');
    const invitation = await this.prisma.invitation.update({
      where: { id },
      data: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + EXPIRY_MS) },
      select: invitationSelect,
    });

    await this.envoyerEmail(existante.email, organisationId, existante.invitedById, token);

    return this.toEntity(invitation as InvitationRow);
  }

  /** Annule une invitation en attente : le lien déjà envoyé cesse de fonctionner. */
  async revoke(organisationId: string, id: string): Promise<void> {
    await this.assertInvitationEnAttente(organisationId, id);
    await this.prisma.invitation.update({
      where: { id },
      data: { statut: StatutInvitation.REVOKEE },
    });
  }

  /** Détails affichés sur la page publique « Rejoindre » à l'ouverture du lien. */
  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { organisation: { select: { nom: true, statut: true } } },
    });

    this.assertExploitable(invitation);

    return {
      email: invitation!.email,
      organisationNom: invitation!.organisation.nom,
      role: invitation!.role,
    };
  }

  /** Crée le compte du membre invité et ouvre sa session. */
  async accept(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: hashToken(dto.token) },
      include: { organisation: { select: { statut: true } } },
    });

    this.assertExploitable(invitation);

    if (invitation!.organisation.statut !== 'VALIDEE') {
      throw new ForbiddenException("L'organisation n'est pas encore validée.");
    }

    const email = invitation!.email;
    const compteExistant = await this.prisma.user.findUnique({ where: { email } });
    if (compteExistant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          nom: dto.nom.trim(),
          role: invitation!.role,
          organisationId: invitation!.organisationId,
          ...(invitation!.serviceId && { serviceId: invitation!.serviceId }),
          ...(invitation!.poste && { poste: invitation!.poste }),
          ...(invitation!.contact && { contact: invitation!.contact }),
        },
      });
      await tx.invitation.update({
        where: { id: invitation!.id },
        data: { statut: StatutInvitation.ACCEPTEE, acceptedAt: new Date() },
      });
      return created;
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      organisationId: user.organisationId,
      role: user.role,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, nom: user.nom, avatarUrl: user.avatarUrl ?? null, role: user.role },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async envoyerEmail(
    email: string,
    organisationId: string,
    inviterUserId: string | null,
    token: string,
  ): Promise<void> {
    const [organisation, inviter] = await Promise.all([
      this.prisma.organisation.findUnique({ where: { id: organisationId }, select: { nom: true } }),
      inviterUserId
        ? this.prisma.user.findUnique({ where: { id: inviterUserId }, select: { nom: true } })
        : Promise.resolve(null),
    ]);

    const joinUrl = `${requireFrontendOrigin(this.config)}/rejoindre?token=${token}`;
    await this.mail.sendInvitation(
      email,
      organisation?.nom ?? 'votre organisation',
      inviter?.nom ?? 'Un administrateur',
      joinUrl,
    );
  }

  private async assertServiceInOrganisation(serviceId: string, organisationId: string): Promise<void> {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, organisationId } });
    if (!service) {
      throw new BadRequestException("Le service indiqué n'appartient pas à cette organisation.");
    }
  }

  private async assertInvitationEnAttente(organisationId: string, id: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation || invitation.organisationId !== organisationId) {
      throw new NotFoundException(`Invitation ${id} introuvable`);
    }
    if (invitation.statut !== StatutInvitation.EN_ATTENTE) {
      throw new ConflictException("Cette invitation n'est plus en attente.");
    }
    return invitation;
  }

  private assertExploitable(invitation: { statut: StatutInvitation; expiresAt: Date } | null): void {
    if (!invitation || invitation.statut !== StatutInvitation.EN_ATTENTE) {
      throw new NotFoundException('Invitation introuvable ou déjà utilisée.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Ce lien d'invitation a expiré. Demandez-en un nouveau.");
    }
  }

  private toEntity(row: InvitationRow): InvitationEntity {
    const { invitedBy, ...rest } = row;
    return { ...rest, invitedByNom: invitedBy?.nom ?? null };
  }
}
