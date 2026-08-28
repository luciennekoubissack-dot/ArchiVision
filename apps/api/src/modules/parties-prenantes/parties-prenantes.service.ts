import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreatePartiePrenanteDto } from './dto/create-partie-prenante.dto';

@Injectable()
export class PartiesPrenantesService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreatePartiePrenanteDto) {
    return this.prisma.partiePrenante.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(this.prisma.partiePrenante, { where: { organisationId }, orderBy: { nom: 'asc' } }, pagination);
  }

  async remove(id: string, organisationId: string) {
    const count = await this.prisma.partiePrenante.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Partie prenante ${id} introuvable`);
    return this.prisma.partiePrenante.delete({ where: { id } });
  }
}
