import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreatePolitiqueDto } from './dto/create-politique.dto';
import { UpdatePolitiqueDto } from './dto/update-politique.dto';

@Injectable()
export class PolitiqueService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreatePolitiqueDto) {
    return this.prisma.politiqueGouvernance.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string) {
    return this.prisma.politiqueGouvernance.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
    });
  }

  async update(id: string, organisationId: string, dto: UpdatePolitiqueDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.politiqueGouvernance.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.politiqueGouvernance.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.politiqueGouvernance.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Politique ${id} introuvable`);
  }
}
