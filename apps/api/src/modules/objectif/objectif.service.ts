import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';

@Injectable()
export class ObjectifService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateObjectifDto) {
    return this.prisma.objectif.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(this.prisma.objectif, { where: { organisationId }, orderBy: { nom: 'asc' } }, pagination);
  }

  async findOne(id: string, organisationId: string) {
    const objectif = await this.prisma.objectif.findUnique({ where: { id } });
    if (!objectif || objectif.organisationId !== organisationId) {
      throw new NotFoundException(`Objectif ${id} introuvable`);
    }
    return objectif;
  }

  async update(id: string, organisationId: string, dto: UpdateObjectifDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.objectif.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.objectif.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.objectif.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Objectif ${id} introuvable`);
  }
}
