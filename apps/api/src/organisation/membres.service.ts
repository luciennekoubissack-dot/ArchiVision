import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateMembreDto } from './dto/create-membre.dto';
import { UpdateMembreDto } from './dto/update-membre.dto';

const membreSelect = {
  id: true,
  email: true,
  nom: true,
  role: true,
  serviceId: true,
  createdAt: true,
} as const;

@Injectable()
export class MembresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
      select: membreSelect,
      orderBy: { nom: 'asc' },
    });
  }

  async create(organisationId: string, dto: CreateMembreDto) {
    const existant = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nom: dto.nom,
        role: dto.role,
        organisationId,
        ...(dto.serviceId && { serviceId: dto.serviceId }),
      },
      select: membreSelect,
    });
  }

  async update(organisationId: string, id: string, dto: UpdateMembreDto) {
    await this.assertMemberExists(id, organisationId);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...('serviceId' in dto && { serviceId: dto.serviceId }),
      },
      select: membreSelect,
    });
  }

  async remove(organisationId: string, id: string) {
    const membre = await this.assertMemberExists(id, organisationId);

    if (membre.role === RoleUtilisateur.ARCHITECTE) {
      const nbArchitectes = await this.prisma.user.count({
        where: { organisationId, role: RoleUtilisateur.ARCHITECTE },
      });
      if (nbArchitectes <= 1) {
        throw new ConflictException("Impossible de supprimer le dernier Architecte de l'organisation");
      }
    }

    await this.prisma.user.delete({ where: { id } });
  }

  private async assertMemberExists(id: string, organisationId: string) {
    const membre = await this.prisma.user.findUnique({ where: { id } });
    if (!membre || membre.organisationId !== organisationId) {
      throw new NotFoundException(`Membre ${id} introuvable`);
    }
    return membre;
  }
}
