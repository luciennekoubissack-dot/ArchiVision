import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        organisationId,
        nom: dto.nom,
        description: dto.description,
        ...(dto.parentId && { parentId: dto.parentId }),
      },
    });
  }

  findAll(organisationId: string) {
    return this.prisma.service.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: {
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            enfants: { orderBy: { nom: 'asc' } },
          },
        },
        _count: { select: { membres: true } },
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
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...('parentId' in dto && { parentId: dto.parentId }),
      },
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
}
