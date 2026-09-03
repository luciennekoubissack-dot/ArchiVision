import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

/** Champs communs à chaque nœud de l'arbre des structures (liste + organigramme). */
const NODE_INCLUDE = {
  titulaire: { select: { id: true, nom: true } },
  _count: { select: { membres: true } },
} as const;

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateServiceDto) {
    if (dto.titulaireId) await this.assertMembreInOrg(dto.titulaireId, organisationId);
    return this.prisma.service.create({
      data: {
        organisationId,
        nom: dto.nom,
        description: dto.description,
        ...(dto.parentId && { parentId: dto.parentId }),
        ...(dto.titulaireId && { titulaireId: dto.titulaireId }),
      },
    });
  }

  /** Membres de l'organisation (id + nom), pour peupler le sélecteur de titulaire. */
  listMembres(organisationId: string) {
    return this.prisma.user.findMany({
      where: { organisationId },
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' },
    });
  }

  findAll(organisationId: string) {
    return this.prisma.service.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: {
        ...NODE_INCLUDE,
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            ...NODE_INCLUDE,
            enfants: { orderBy: { nom: 'asc' }, include: NODE_INCLUDE },
          },
        },
      },
    });
  }

  async findOne(id: string, organisationId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, nom: true } },
        enfants: { orderBy: { nom: 'asc' } },
        membres: { select: { id: true, nom: true, role: true } },
      },
    });
    if (!service || service.organisationId !== organisationId) {
      throw new NotFoundException(`Service ${id} introuvable`);
    }
    return service;
  }

  async update(id: string, organisationId: string, dto: UpdateServiceDto) {
    await this.assertExists(id, organisationId);
    if (dto.titulaireId) await this.assertMembreInOrg(dto.titulaireId, organisationId);
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...('parentId' in dto && { parentId: dto.parentId }),
        // `titulaireId: null` => poste vacant ; absent => inchangé.
        ...('titulaireId' in dto && { titulaireId: dto.titulaireId ?? null }),
      },
      include: NODE_INCLUDE,
    });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.service.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.service.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Service ${id} introuvable`);
  }

  private async assertMembreInOrg(userId: string, organisationId: string) {
    const count = await this.prisma.user.count({ where: { id: userId, organisationId } });
    if (!count) {
      throw new BadRequestException("Le titulaire choisi n'appartient pas à cette organisation");
    }
  }
}
