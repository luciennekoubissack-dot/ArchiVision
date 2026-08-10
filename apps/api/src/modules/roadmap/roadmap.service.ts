import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateProjetDto) {
    return this.prisma.projet.create({
      data: {
        ...dto,
        organisationId,
        ...(dto.dateDebut && { dateDebut: new Date(dto.dateDebut) }),
        ...(dto.dateFin && { dateFin: new Date(dto.dateFin) }),
      },
    });
  }

  findAll(organisationId: string) {
    return this.prisma.projet.findMany({
      where: { organisationId },
      orderBy: [{ priorite: 'asc' }, { dateDebut: 'asc' }],
    });
  }

  async findOne(id: string, organisationId: string) {
    const projet = await this.prisma.projet.findUnique({ where: { id } });
    if (!projet || projet.organisationId !== organisationId) {
      throw new NotFoundException(`Projet ${id} introuvable`);
    }
    return projet;
  }

  async update(id: string, organisationId: string, dto: UpdateProjetDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.projet.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dateDebut && { dateDebut: new Date(dto.dateDebut) }),
        ...(dto.dateFin && { dateFin: new Date(dto.dateFin) }),
      },
    });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.projet.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.projet.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Projet ${id} introuvable`);
  }
}
