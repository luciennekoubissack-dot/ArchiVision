import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateChangementDto } from './dto/create-changement.dto';
import { UpdateChangementDto } from './dto/update-changement.dto';

@Injectable()
export class ChangementService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateChangementDto) {
    return this.prisma.demandeChangement.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(this.prisma.demandeChangement, { where: { organisationId }, orderBy: { createdAt: 'desc' } }, pagination);
  }

  async update(id: string, organisationId: string, dto: UpdateChangementDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.demandeChangement.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.demandeChangement.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.demandeChangement.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Demande de changement ${id} introuvable`);
  }
}
