import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@archivision/infrastructure';
import { organisationNonValideeError, requireFrontendOrigin } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

/** Durée de validité d'un lien de réinitialisation de mot de passe. */
const RESET_EXPIRY_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organisation: { select: { statut: true } } },
    });

    // Temps constant même si l'utilisateur n'existe pas
    const hash = user?.passwordHash ?? '$2b$10$invalidhashfortimingprotection00000000000000';
    const valid = await bcrypt.compare(password, hash);

    if (!user || !valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Un compte entreprise ne peut se connecter que si son organisation a été
    // validée par le superadmin. Le SUPERADMIN (sans organisation) est exempté.
    if (user.role !== RoleUtilisateur.SUPERADMIN && user.organisation?.statut !== 'VALIDEE') {
      throw new ForbiddenException(organisationNonValideeError(user.organisation?.statut));
    }

    return this.buildAuthResponse(user);
  }

  async register(dto: RegisterDto) {
    const existant = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { organisation } = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          nom: dto.organisationNom,
          description: dto.organisationDescription,
          secteur: dto.secteur,
          taille: dto.taille,
          pays: dto.pays,
          ville: dto.ville,
          logoUrl: dto.logoUrl,
          vision: dto.vision,
          problemesResoudre: dto.problemesResoudre,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          nom: dto.nom,
          organisationId: organisation.id,
          role: RoleUtilisateur.ADMINISTRATEUR,
        },
      });

      const organisationId = organisation.id;

      // Amorçage optionnel du référentiel — chaque liste vient d'une étape
      // passable de l'assistant d'inscription, donc potentiellement vide.
      if (dto.objectifs?.length) {
        await tx.objectif.createMany({
          data: dto.objectifs.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.partiesPrenantes?.length) {
        await tx.partiePrenante.createMany({
          data: dto.partiesPrenantes.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.bpmnProcessus?.length) {
        await tx.bpmnProcessus.createMany({
          data: dto.bpmnProcessus.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.capacitesMetier?.length) {
        await tx.capaciteMetier.createMany({
          data: dto.capacitesMetier.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.acteurs?.length) {
        await tx.elementArchimate.createMany({
          data: dto.acteurs.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.dataEntities?.length) {
        await tx.dataEntity.createMany({
          data: dto.dataEntities.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.applications?.length) {
        await tx.application.createMany({
          data: dto.applications.map((item) => ({ ...item, organisationId })),
        });
      }
      if (dto.techComponents?.length) {
        await tx.techComponent.createMany({
          data: dto.techComponents.map((item) => ({ ...item, organisationId })),
        });
      }

      return { organisation, user };
    });

    // Aucune session n'est ouverte : l'organisation démarre EN_ATTENTE et ne
    // pourra se connecter qu'une fois validée par le superadmin, qui envoie
    // alors le lien de connexion par e-mail.
    return {
      organisation: {
        id: organisation.id,
        nom: organisation.nom,
        statut: organisation.statut,
      },
      message:
        "Votre inscription a bien été enregistrée. Vous recevrez un e-mail contenant le lien de connexion dès que votre organisation aura été validée par l'équipe ArchiVision.",
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
    });
  }

  /**
   * Envoie un lien de réinitialisation si un compte existe pour cet e-mail.
   * Répond toujours de la même façon côté contrôleur, que le compte existe
   * ou non : ne jamais laisser deviner quels e-mails sont enregistrés.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
      },
    });

    const resetUrl = `${requireFrontendOrigin(this.config)}/reinitialiser-mot-de-passe?token=${token}`;
    await this.mail.sendPasswordReset(user.email, resetUrl);
  }

  /** Vérifie le jeton, remplace le mot de passe et ouvre une session. */
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt) {
      throw new BadRequestException('Ce lien de réinitialisation est invalide ou a déjà été utilisé.');
    }
    if (resetToken.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Ce lien de réinitialisation a expiré. Demandez-en un nouveau.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      // Un jeton utilisé invalide les autres demandes en attente pour ce
      // compte, pour ne pas laisser traîner un lien encore valable après
      // qu'un mot de passe a déjà été choisi.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return this.buildAuthResponse(resetToken.user);
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    nom: string;
    avatarUrl?: string | null;
    organisationId: string | null;
    role: RoleUtilisateur;
  }) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      organisationId: user.organisationId,
      role: user.role,
    });

    return {
      accessToken: token,
      user: { id: user.id, email: user.email, nom: user.nom, avatarUrl: user.avatarUrl ?? null, role: user.role },
    };
  }
}
