import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

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
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          nom: dto.nom,
          organisationId: organisation.id,
          role: RoleUtilisateur.ARCHITECTE,
        },
      });

      return { organisation, user };
    });

    return {
      ...(await this.buildAuthResponse(user)),
      organisation: {
        id: organisation.id,
        nom: organisation.nom,
        description: organisation.description,
        secteur: organisation.secteur,
        taille: organisation.taille,
        pays: organisation.pays,
        logoUrl: organisation.logoUrl,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nom: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    nom: string;
    organisationId: string;
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
      user: { id: user.id, email: user.email, nom: user.nom, role: user.role },
    };
  }
}
