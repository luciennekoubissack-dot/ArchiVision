import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Temps constant même si l'utilisateur n'existe pas
    const hash = user?.passwordHash ?? '$2b$10$invalidhashfortimingprotection00000000000000';
    const valid = await bcrypt.compare(password, hash);

    if (!user || !valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.buildAuthResponse(user);
  }

  async register(dto: RegisterDto) {
    const existant = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { organisation, user } = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: {
          nom: dto.organisationNom,
          description: dto.organisationDescription,
          secteur: dto.secteur,
          taille: dto.taille,
          pays: dto.pays,
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

    // Connexion immédiate : l'organisation démarre en EN_ATTENTE (visible et
    // gérable par le superadmin), mais ce statut ne bloque plus l'accès.
    return {
      ...this.buildAuthResponse(user),
      organisation: {
        id: organisation.id,
        nom: organisation.nom,
        statut: organisation.statut,
      },
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
