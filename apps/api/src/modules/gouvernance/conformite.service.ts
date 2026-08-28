import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { ConformiteItemDto } from './dto/update-conformites.dto';

@Injectable()
export class ConformiteService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.conformiteSolution,
      {
        where: { solution: { organisationId } },
        include: { solution: { select: { id: true, nom: true } }, politique: { select: { id: true, nom: true } } },
      },
      pagination,
    );
  }

  async findBySolution(solutionId: string, organisationId: string) {
    await this.assertSolutionExists(solutionId, organisationId);
    return this.prisma.conformiteSolution.findMany({
      where: { solutionId },
      include: { politique: { select: { id: true, nom: true } } },
    });
  }

  async updateConformites(solutionId: string, organisationId: string, items: ConformiteItemDto[]) {
    await this.assertSolutionExists(solutionId, organisationId);

    const politiqueIds = items.map((item) => item.politiqueId);
    const count = await this.prisma.politiqueGouvernance.count({
      where: { id: { in: politiqueIds }, organisationId },
    });
    if (count !== new Set(politiqueIds).size) {
      throw new NotFoundException('Une ou plusieurs politiques introuvables');
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.conformiteSolution.upsert({
          where: { solutionId_politiqueId: { solutionId, politiqueId: item.politiqueId } },
          create: { solutionId, politiqueId: item.politiqueId, statut: item.statut, commentaire: item.commentaire },
          update: { statut: item.statut, commentaire: item.commentaire },
        }),
      ),
    );

    return this.findBySolution(solutionId, organisationId);
  }

  private async assertSolutionExists(solutionId: string, organisationId: string) {
    const count = await this.prisma.solution.count({ where: { id: solutionId, organisationId } });
    if (!count) throw new NotFoundException(`Solution ${solutionId} introuvable`);
  }
}
