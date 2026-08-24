import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { EnqueteReponseItemDto } from './dto/import-enquete.dto';

@Injectable()
export class EnqueteReponseService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organisationId: string) {
    return this.prisma.enqueteReponse.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async importReponses(organisationId: string, items: EnqueteReponseItemDto[]) {
    await this.prisma.enqueteReponse.createMany({
      data: items.map((item) => ({ ...item, organisationId })),
    });
    return this.findAll(organisationId);
  }

  async remove(id: string, organisationId: string) {
    const count = await this.prisma.enqueteReponse.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Réponse ${id} introuvable`);
    return this.prisma.enqueteReponse.delete({ where: { id } });
  }
}
